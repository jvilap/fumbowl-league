import { db } from "@/lib/db";
import {
  coaches,
  eloRatings,
  eloHistory,
  matches,
  teams,
  tournaments,
} from "@/lib/db/schema";
import { eq, desc, asc, sql, isNotNull, isNull, and } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import CoachEloChart from "@/components/charts/CoachEloChartWrapper";
import type { CoachSegment } from "@/components/charts/CoachEloChart";
import { CHART_COLORS } from "@/lib/charts/theme";

export const revalidate = 3600;

const activeStyle =
  "font-mono text-xs px-3 py-1 bg-gold text-surface";
const inactiveStyle =
  "font-mono text-xs px-3 py-1 border border-rim text-parchment-faint hover:text-parchment transition-colors";

interface Props {
  params: Promise<{ coachId: string }>;
  searchParams: Promise<{ preseason?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { coachId } = await params;
  const id = parseInt(coachId, 10);
  const [coach] = await db
    .select({ name: coaches.name })
    .from(coaches)
    .where(eq(coaches.id, id))
    .limit(1);
  if (!coach) return { title: "Entrenador — Fumbowl League" };
  return { title: `${coach.name} — Fumbowl League` };
}

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("es-ES", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function eloColor(rating: number): string {
  if (rating >= 1200) return "text-gold-bright";
  if (rating >= 1100) return "text-gold";
  if (rating >= 1000) return "text-parchment";
  return "text-parchment-dim";
}

export default async function CoachProfilePage({ params, searchParams }: Props) {
  const [{ coachId }, { preseason }] = await Promise.all([params, searchParams]);
  const id = parseInt(coachId, 10);
  if (isNaN(id)) notFound();

  const withPreseason = (preseason ?? "1") !== "0";

  // Coach + ELO
  const [coachRow] = await db
    .select({
      id: coaches.id,
      name: coaches.name,
      rating: withPreseason ? eloRatings.rating : eloRatings.ratingCore,
      wins: eloRatings.wins,
      ties: eloRatings.ties,
      losses: eloRatings.losses,
      gamesPlayed: eloRatings.gamesPlayed,
      lastMatchDate: eloRatings.lastMatchDate,
    })
    .from(coaches)
    .leftJoin(eloRatings, eq(coaches.id, eloRatings.coachId))
    .where(eq(coaches.id, id))
    .limit(1);

  if (!coachRow) notFound();

  // Rank
  const rankResult = await db
    .select({ rank: sql<number>`rank() over (order by rating desc)`, coachId: eloRatings.coachId })
    .from(eloRatings);
  const rankRow = rankResult.find((r) => r.coachId === id);
  const rank = rankRow ? Number(rankRow.rank) : null;

  // ELO history for full chart
  const historyRows = await db
    .select({
      eloAfter: withPreseason ? eloHistory.eloAfter : eloHistory.eloAfterCore,
      matchDate: eloHistory.matchDate,
      seasonId: tournaments.seasonId,
    })
    .from(eloHistory)
    .innerJoin(matches, eq(eloHistory.matchId, matches.id))
    .leftJoin(tournaments, eq(matches.tournamentId, tournaments.id))
    .where(
      withPreseason
        ? eq(eloHistory.coachId, id)
        : and(eq(eloHistory.coachId, id), isNotNull(eloHistory.eloAfterCore))
    )
    .orderBy(asc(eloHistory.matchDate));

  // Team aliases for recent matches
  const team1 = alias(teams, "team1");
  const team2 = alias(teams, "team2");

  // Next match aliases (separate DB alias strings to avoid conflict)
  const nextTeam1 = alias(teams, "next_team1");
  const nextTeam2 = alias(teams, "next_team2");

  // Próximo adversario — partido pendiente en torneo activo
  const [nextMatch] = await db
    .select({
      id: matches.id,
      round: matches.round,
      tournamentName: tournaments.name,
      team1CoachId: matches.team1CoachId,
      team2CoachId: matches.team2CoachId,
      team1Name: nextTeam1.name,
      team1Roster: nextTeam1.rosterName,
      team2Name: nextTeam2.name,
      team2Roster: nextTeam2.rosterName,
    })
    .from(matches)
    .innerJoin(tournaments, eq(matches.tournamentId, tournaments.id))
    .leftJoin(nextTeam1, eq(matches.team1Id, nextTeam1.id))
    .leftJoin(nextTeam2, eq(matches.team2Id, nextTeam2.id))
    .where(
      and(
        sql`(${matches.team1CoachId} = ${id} OR ${matches.team2CoachId} = ${id})`,
        eq(tournaments.status, "In Progress"),
        isNull(matches.team1Score)
      )
    )
    .orderBy(asc(matches.round))
    .limit(1);

  const recentMatches = await db
    .select({
      id: matches.id,
      date: matches.date,
      tournamentName: tournaments.name,
      tournamentId: matches.tournamentId,
      team1Name: team1.name,
      team1Score: matches.team1Score,
      team2Name: team2.name,
      team2Score: matches.team2Score,
      winnerCoachId: matches.winnerCoachId,
      team1CoachId: matches.team1CoachId,
    })
    .from(matches)
    .leftJoin(tournaments, eq(matches.tournamentId, tournaments.id))
    .leftJoin(team1, eq(matches.team1Id, team1.id))
    .leftJoin(team2, eq(matches.team2Id, team2.id))
    .where(
      sql`(${matches.team1CoachId} = ${id} OR ${matches.team2CoachId} = ${id})`
    )
    .orderBy(desc(matches.date))
    .limit(10);

  // Teams history
  const teamHistory = await db
    .select({
      id: teams.id,
      name: teams.name,
      rosterName: teams.rosterName,
      seasonId: teams.seasonId,
      recordWins: teams.recordWins,
      recordTies: teams.recordTies,
      recordLosses: teams.recordLosses,
      recordGames: teams.recordGames,
    })
    .from(teams)
    .where(eq(teams.coachId, id))
    .orderBy(desc(teams.seasonId));

  // Build chart data from history rows
  const teamBySeasonId = new Map(
    teamHistory.map((t) => [t.seasonId, t.rosterName ?? "?"])
  );

  const seasonIds = [...new Set(
    historyRows.map((h) => h.seasonId).filter((s): s is string => s !== null)
  )];

  const segments: CoachSegment[] = seasonIds.map((seasonId, i) => ({
    dataKey: seasonId,
    label: `${seasonId} — ${teamBySeasonId.get(seasonId) ?? "?"}`,
    color: CHART_COLORS.series[i % CHART_COLORS.series.length],
  }));

  const coachDateMap = new Map<string, Record<string, number>>();
  for (const row of historyRows) {
    if (!row.matchDate || !row.seasonId || row.eloAfter === null) continue;
    const d = new Date(row.matchDate).toLocaleDateString("es-ES", {
      timeZone: "UTC",
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
    if (!coachDateMap.has(d)) coachDateMap.set(d, {});
    coachDateMap.get(d)![row.seasonId] = Math.round(row.eloAfter);
  }
  const coachChartData = Array.from(coachDateMap.entries()).map(([date, vals]) => ({
    date,
    ...vals,
  }));

  const rating = coachRow.rating ? Math.round(coachRow.rating) : null;

  return (
    <main className="max-w-5xl mx-auto px-6 pb-16">
      <PageHeader title="PERFIL DE ENTRENADOR" />

      {/* Header card */}
      <div className="border border-rim bg-surface p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="font-cinzel text-3xl font-bold text-parchment tracking-wide">
              {coachRow.name}
            </h2>
            {rank && (
              <p className="font-mono text-sm text-parchment-faint mt-1">
                Posición global:{" "}
                <span className="text-gold font-bold">#{rank}</span>
              </p>
            )}
          </div>
          {rating && (
            <div className="text-right">
              <p className="font-cinzel text-xs uppercase tracking-widest text-parchment-faint mb-1">
                ELO Rating
              </p>
              <p className={`font-mono text-5xl font-bold ${eloColor(rating)}`}>
                {rating}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {[
            { label: "Victorias", value: coachRow.wins ?? 0, color: "text-win" },
            { label: "Empates", value: coachRow.ties ?? 0, color: "text-parchment-dim" },
            { label: "Derrotas", value: coachRow.losses ?? 0, color: "text-loss" },
            { label: "Partidos", value: coachRow.gamesPlayed ?? 0, color: "text-parchment" },
          ].map((s) => (
            <div key={s.label} className="border border-rim p-3 text-center">
              <p className="font-cinzel text-xs uppercase tracking-widest text-parchment-faint mb-1">
                {s.label}
              </p>
              <p className={`font-mono text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {nextMatch && (() => {
          const isTeam1 = nextMatch.team1CoachId === id;
          const opponentName = isTeam1 ? nextMatch.team2Name : nextMatch.team1Name;
          const opponentRoster = isTeam1 ? nextMatch.team2Roster : nextMatch.team1Roster;
          return (
            <div className="mt-4 border-t border-rim pt-4">
              <p className="font-cinzel text-xs uppercase tracking-widest text-parchment-faint mb-2">
                Próximo Partido
              </p>
              <div className="flex items-center justify-between border border-rim bg-elevated px-4 py-3">
                <div>
                  <p className="font-barlow font-semibold text-parchment text-base">
                    {opponentName ?? "—"}
                  </p>
                  {opponentRoster && (
                    <p className="font-mono text-xs text-parchment-faint">{opponentRoster}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs text-parchment-faint">{nextMatch.tournamentName}</p>
                  {nextMatch.round && (
                    <p className="font-mono text-xs text-gold">Ronda {nextMatch.round}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {coachChartData.length > 1 && (
          <div className="mt-6 border-t border-rim pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-cinzel text-xs uppercase tracking-widest text-parchment-faint">
                Evolución ELO por Temporada
              </p>
              <div className="flex gap-2">
                <Link
                  href={`/entrenador/${id}`}
                  className={withPreseason ? activeStyle : inactiveStyle}
                >
                  Con pretemporada
                </Link>
                <Link
                  href={`/entrenador/${id}?preseason=0`}
                  className={!withPreseason ? activeStyle : inactiveStyle}
                >
                  Sin pretemporada
                </Link>
              </div>
            </div>
            <div className="border border-rim bg-surface p-4">
              <CoachEloChart data={coachChartData} segments={segments} />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent matches */}
        <div>
          <h3 className="font-cinzel text-sm uppercase tracking-widest text-gold mb-3">
            Partidos Recientes
          </h3>
          <div className="border border-rim overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-rim">
                  <th className="px-3 py-2 text-left font-cinzel text-xs uppercase tracking-wider text-parchment-faint">Fecha</th>
                  <th className="px-3 py-2 text-left font-cinzel text-xs uppercase tracking-wider text-parchment-faint">Rival</th>
                  <th className="px-3 py-2 text-center font-cinzel text-xs uppercase tracking-wider text-parchment-faint">Res.</th>
                </tr>
              </thead>
              <tbody>
                {recentMatches.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-center font-mono text-xs text-parchment-faint">
                      Sin partidas
                    </td>
                  </tr>
                )}
                {recentMatches.map((m) => {
                  const isTeam1 = m.team1CoachId === id;
                  const myScore = isTeam1 ? m.team1Score : m.team2Score;
                  const opponentScore = isTeam1 ? m.team2Score : m.team1Score;
                  const opponentName = isTeam1 ? m.team2Name : m.team1Name;
                  const result =
                    m.winnerCoachId === null
                      ? "E"
                      : m.winnerCoachId === id
                      ? "V"
                      : "D";
                  const resultColor =
                    result === "V"
                      ? "text-win"
                      : result === "D"
                      ? "text-loss"
                      : "text-parchment-faint";

                  return (
                    <tr
                      key={m.id}
                      className="border-b border-rim last:border-0 hover:bg-elevated transition-colors"
                    >
                      <td className="px-3 py-2 font-mono text-xs text-parchment-faint whitespace-nowrap">
                        {formatDate(m.date)}
                      </td>
                      <td className="px-3 py-2 font-barlow text-sm text-parchment">
                        {opponentName ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`font-mono text-xs font-bold ${resultColor}`}>
                          {result} {myScore ?? "?"}-{opponentScore ?? "?"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Teams history */}
        <div>
          <h3 className="font-cinzel text-sm uppercase tracking-widest text-gold mb-3">
            Equipos por Temporada
          </h3>
          <div className="border border-rim overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-rim">
                  <th className="px-3 py-2 text-left font-cinzel text-xs uppercase tracking-wider text-parchment-faint">Temp.</th>
                  <th className="px-3 py-2 text-left font-cinzel text-xs uppercase tracking-wider text-parchment-faint">Equipo</th>
                  <th className="px-3 py-2 text-center font-cinzel text-xs uppercase tracking-wider text-parchment-faint">V/E/D</th>
                </tr>
              </thead>
              <tbody>
                {teamHistory.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-center font-mono text-xs text-parchment-faint">
                      Sin equipos
                    </td>
                  </tr>
                )}
                {teamHistory.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-rim last:border-0 hover:bg-elevated transition-colors"
                  >
                    <td className="px-3 py-2 font-mono text-xs text-parchment-faint">
                      {t.seasonId ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/equipo/${t.id}`}
                        className="font-barlow text-sm text-parchment hover:text-gold transition-colors"
                      >
                        {t.name}
                      </Link>
                      {t.rosterName && (
                        <span className="font-mono text-xs text-parchment-faint ml-2">
                          {t.rosterName}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-center">
                      <span className="text-win">{t.recordWins ?? 0}</span>
                      <span className="text-parchment-faint">/{t.recordTies ?? 0}/</span>
                      <span className="text-loss">{t.recordLosses ?? 0}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
