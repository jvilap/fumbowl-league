import { db } from "@/lib/db";
import { teams, coaches, players, tournaments, matches } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import FormBadges from "@/components/divisions/FormBadges";

export const revalidate = 3600;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const [t] = await db
    .select({ name: teams.name })
    .from(teams)
    .where(eq(teams.id, parseInt(id, 10)))
    .limit(1);
  if (!t) return { title: "Equipo — Fumbowl League" };
  return { title: `${t.name} — Fumbowl League` };
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

export default async function EquipoPage({ params }: Props) {
  const { id } = await params;
  const tId = parseInt(id, 10);
  if (isNaN(tId)) notFound();

  // Team + coach
  const [teamRow] = await db
    .select({
      id: teams.id,
      name: teams.name,
      coachId: teams.coachId,
      coachName: coaches.name,
      rosterName: teams.rosterName,
      seasonId: teams.seasonId,
      tournamentId: teams.tournamentId,
      teamValue: teams.teamValue,
      currentTeamValue: teams.currentTeamValue,
      rerolls: teams.rerolls,
      fanFactor: teams.fanFactor,
      apothecary: teams.apothecary,
      recordGames: teams.recordGames,
      recordWins: teams.recordWins,
      recordTies: teams.recordTies,
      recordLosses: teams.recordLosses,
      recordTdFor: teams.recordTdFor,
      recordTdAgainst: teams.recordTdAgainst,
      recordCasFor: teams.recordCasFor,
      recordCasAgainst: teams.recordCasAgainst,
      form: teams.form,
      status: teams.status,
    })
    .from(teams)
    .innerJoin(coaches, eq(teams.coachId, coaches.id))
    .where(eq(teams.id, tId))
    .limit(1);

  if (!teamRow) notFound();

  // Tournament info
  let tournamentName: string | null = null;
  if (teamRow.tournamentId) {
    const [t] = await db
      .select({ name: tournaments.name })
      .from(tournaments)
      .where(eq(tournaments.id, teamRow.tournamentId))
      .limit(1);
    tournamentName = t?.name ?? null;
  }

  // Players sorted by SPP desc
  const playerRows = await db
    .select({
      id: players.id,
      number: players.number,
      name: players.name,
      position: players.position,
      games: players.games,
      touchdowns: players.touchdowns,
      casualties: players.casualties,
      completions: players.completions,
      mvps: players.mvps,
      spp: players.spp,
      skills: players.skills,
      injuries: players.injuries,
      status: players.status,
    })
    .from(players)
    .where(eq(players.teamId, tId))
    .orderBy(desc(players.spp));

  // Recent matches for this team
  const team1 = alias(teams, "t1");
  const team2 = alias(teams, "t2");

  const recentMatches = await db
    .select({
      id: matches.id,
      date: matches.date,
      team1Id: matches.team1Id,
      team1Name: team1.name,
      team1Score: matches.team1Score,
      team2Name: team2.name,
      team2Score: matches.team2Score,
      winnerCoachId: matches.winnerCoachId,
      team1CoachId: matches.team1CoachId,
    })
    .from(matches)
    .leftJoin(team1, eq(matches.team1Id, team1.id))
    .leftJoin(team2, eq(matches.team2Id, team2.id))
    .where(
      sql`(${matches.team1Id} = ${tId} OR ${matches.team2Id} = ${tId})`
    )
    .orderBy(desc(matches.date))
    .limit(10);

  return (
    <main className="max-w-6xl mx-auto px-6 pb-16">
      <PageHeader title="PERFIL DE EQUIPO" />

      {/* Team header */}
      <div className="border border-rim bg-surface p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="font-cinzel text-3xl font-bold text-parchment tracking-wide">
              {teamRow.name}
            </h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              <Link
                href={`/entrenador/${teamRow.coachId}`}
                className="font-barlow text-sm text-parchment-dim hover:text-parchment transition-colors"
              >
                {teamRow.coachName}
              </Link>
              {teamRow.rosterName && (
                <span className="font-mono text-sm text-gold">{teamRow.rosterName}</span>
              )}
              {teamRow.seasonId && (
                <span className="font-mono text-xs text-parchment-faint">{teamRow.seasonId}</span>
              )}
              {tournamentName && (
                <Link
                  href={`/torneo/${teamRow.tournamentId}`}
                  className="font-mono text-xs text-parchment-faint hover:text-parchment-dim transition-colors"
                >
                  {tournamentName}
                </Link>
              )}
            </div>
          </div>
          <div className="text-right">
            <FormBadges form={teamRow.form} />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {[
            { label: "Victorias", value: teamRow.recordWins ?? 0, color: "text-win" },
            { label: "Empates", value: teamRow.recordTies ?? 0, color: "text-parchment-dim" },
            { label: "Derrotas", value: teamRow.recordLosses ?? 0, color: "text-loss" },
            { label: "GF/GC", value: `${teamRow.recordTdFor ?? 0}/${teamRow.recordTdAgainst ?? 0}`, color: "text-parchment" },
          ].map((s) => (
            <div key={s.label} className="border border-rim p-3 text-center">
              <p className="font-cinzel text-xs uppercase tracking-widest text-parchment-faint mb-1">{s.label}</p>
              <p className={`font-mono text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {(teamRow.teamValue || teamRow.rerolls !== null) && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-rim">
            {teamRow.teamValue && (
              <span className="font-mono text-xs text-parchment-faint">
                TV: <span className="text-parchment">{teamRow.teamValue.toLocaleString("es-ES")}k</span>
              </span>
            )}
            {teamRow.rerolls !== null && (
              <span className="font-mono text-xs text-parchment-faint">
                Rerolls: <span className="text-parchment">{teamRow.rerolls}</span>
              </span>
            )}
            {teamRow.fanFactor !== null && (
              <span className="font-mono text-xs text-parchment-faint">
                Fan Factor: <span className="text-parchment">{teamRow.fanFactor}</span>
              </span>
            )}
            {teamRow.apothecary && (
              <span className="font-mono text-xs text-win">Apothecary</span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Players table */}
        <div className="lg:col-span-2">
          <h3 className="font-cinzel text-sm uppercase tracking-widest text-gold mb-3">
            Plantilla ({playerRows.length} jugadores)
          </h3>
          <div className="border border-rim overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-rim">
                  <th className="px-2 py-2 text-right font-cinzel text-xs uppercase tracking-wider text-parchment-faint">#</th>
                  <th className="px-3 py-2 text-left font-cinzel text-xs uppercase tracking-wider text-parchment-faint">Jugador</th>
                  <th className="px-2 py-2 text-right font-cinzel text-xs uppercase tracking-wider text-parchment-faint">PJ</th>
                  <th className="px-2 py-2 text-right font-cinzel text-xs uppercase tracking-wider text-parchment-faint">TD</th>
                  <th className="px-2 py-2 text-right font-cinzel text-xs uppercase tracking-wider text-parchment-faint">CAS</th>
                  <th className="px-2 py-2 text-right font-cinzel text-xs uppercase tracking-wider text-parchment-faint">MVP</th>
                  <th className="px-2 py-2 text-right font-cinzel text-xs uppercase tracking-wider text-parchment-faint">SPP</th>
                </tr>
              </thead>
              <tbody>
                {playerRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-center font-mono text-xs text-parchment-faint">
                      Sin jugadores registrados
                    </td>
                  </tr>
                )}
                {playerRows.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-rim last:border-0 hover:bg-elevated transition-colors"
                  >
                    <td className="px-2 py-2 font-mono text-xs text-parchment-faint text-right">
                      {p.number ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-barlow text-sm text-parchment leading-tight">
                        {p.name}
                        {p.status !== 0 && (
                          <span className="text-loss ml-1 text-xs">✝</span>
                        )}
                      </p>
                      {p.position && (
                        <p className="font-mono text-xs text-parchment-faint">{p.position}</p>
                      )}
                      {p.skills && (p.skills as string[]).length > 0 && (
                        <p className="font-mono text-xs text-gold-dim">
                          {(p.skills as string[]).join(", ")}
                        </p>
                      )}
                      {p.injuries && (
                        <p className="font-mono text-xs text-loss">{p.injuries}</p>
                      )}
                    </td>
                    <td className="px-2 py-2 font-mono text-xs text-parchment-dim text-right">{p.games ?? 0}</td>
                    <td className="px-2 py-2 font-mono text-xs text-win text-right font-bold">{p.touchdowns ?? 0}</td>
                    <td className="px-2 py-2 font-mono text-xs text-parchment-dim text-right">{p.casualties ?? 0}</td>
                    <td className="px-2 py-2 font-mono text-xs text-parchment-dim text-right">{p.mvps ?? 0}</td>
                    <td className="px-2 py-2 font-mono text-xs text-gold text-right font-bold">{p.spp ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent matches */}
        <div>
          <h3 className="font-cinzel text-sm uppercase tracking-widest text-gold mb-3">
            Partidas Recientes
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
                  const isTeam1 = m.team1Id === tId;
                  const myScore = isTeam1 ? m.team1Score : m.team2Score;
                  const opponentScore = isTeam1 ? m.team2Score : m.team1Score;
                  const opponentName = isTeam1 ? m.team2Name : m.team1Name;
                  const result =
                    m.winnerCoachId === null
                      ? "E"
                      : (isTeam1 && m.team1CoachId === m.winnerCoachId) ||
                        (!isTeam1 && m.team1CoachId !== m.winnerCoachId)
                      ? "V"
                      : "D";
                  const resultColor =
                    result === "V" ? "text-win" : result === "D" ? "text-loss" : "text-parchment-faint";

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
      </div>
    </main>
  );
}
