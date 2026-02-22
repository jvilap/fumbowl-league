import { db } from "@/lib/db";
import { tournaments, teams, coaches, matches } from "@/lib/db/schema";
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
    .select({ name: tournaments.name })
    .from(tournaments)
    .where(eq(tournaments.id, parseInt(id, 10)))
    .limit(1);
  if (!t) return { title: "Torneo — Fumbowl League" };
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

export default async function TorneoPage({ params }: Props) {
  const { id } = await params;
  const tId = parseInt(id, 10);
  if (isNaN(tId)) notFound();

  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, tId))
    .limit(1);

  if (!tournament) notFound();

  // Teams standings
  const teamsRows = await db
    .select({
      id: teams.id,
      coachId: teams.coachId,
      name: teams.name,
      coachName: coaches.name,
      rosterName: teams.rosterName,
      recordGames: teams.recordGames,
      recordWins: teams.recordWins,
      recordTies: teams.recordTies,
      recordLosses: teams.recordLosses,
      recordTdFor: teams.recordTdFor,
      recordTdAgainst: teams.recordTdAgainst,
      recordCasFor: teams.recordCasFor,
      form: teams.form,
    })
    .from(teams)
    .innerJoin(coaches, eq(teams.coachId, coaches.id))
    .where(
      sql`${teams.id} IN (
        SELECT team1_id FROM matches WHERE tournament_id = ${tId}
        UNION
        SELECT team2_id FROM matches WHERE tournament_id = ${tId}
      )`
    )
    .orderBy(desc(teams.recordWins), desc(teams.recordTies), desc(teams.recordTdFor));

  // Recent matches in this tournament
  const team1 = alias(teams, "t1");
  const team2 = alias(teams, "t2");

  const recentMatches = await db
    .select({
      id: matches.id,
      date: matches.date,
      round: matches.round,
      team1Name: team1.name,
      team1Score: matches.team1Score,
      team2Name: team2.name,
      team2Score: matches.team2Score,
      winnerCoachId: matches.winnerCoachId,
    })
    .from(matches)
    .leftJoin(team1, eq(matches.team1Id, team1.id))
    .leftJoin(team2, eq(matches.team2Id, team2.id))
    .where(eq(matches.tournamentId, tId))
    .orderBy(desc(matches.date))
    .limit(20);

  const typeLabel: Record<string, string> = {
    Swiss: "Swiss",
    RoundRobin: "Round Robin",
    Knockout: "Knockout",
  };

  return (
    <main className="max-w-6xl mx-auto px-6 pb-16">
      <PageHeader
        title={tournament.name}
        subtitle={`${typeLabel[tournament.type] ?? tournament.type} · ${tournament.status === "In Progress" ? "En curso" : "Completado"} · Temporada ${tournament.seasonId ?? "—"}`}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Equipos", value: teamsRows.length },
          { label: "Inicio", value: formatDate(tournament.start) },
          { label: "Fin", value: formatDate(tournament.end) },
          { label: "Estado", value: tournament.status === "In Progress" ? "En curso" : "Finalizado" },
        ].map((s) => (
          <div key={s.label} className="border border-rim bg-surface p-3 text-center">
            <p className="font-cinzel text-xs uppercase tracking-widest text-parchment-faint mb-1">{s.label}</p>
            <p className="font-mono text-sm text-parchment font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Standings */}
      {teamsRows.length > 0 && (
        <div className="mb-8">
          <h3 className="font-cinzel text-sm uppercase tracking-widest text-gold mb-3">
            Clasificación
          </h3>
          <div className="border border-rim overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-rim">
                  <th className="px-3 py-3 text-right font-cinzel text-xs uppercase tracking-widest text-parchment-faint">#</th>
                  <th className="px-3 py-3 text-left font-cinzel text-xs uppercase tracking-widest text-parchment-faint">Equipo</th>
                  <th className="px-3 py-3 text-right font-cinzel text-xs uppercase tracking-widest text-parchment-faint">PJ</th>
                  <th className="px-3 py-3 text-right font-cinzel text-xs uppercase tracking-widest text-parchment-faint">V</th>
                  <th className="px-3 py-3 text-right font-cinzel text-xs uppercase tracking-widest text-parchment-faint">E</th>
                  <th className="px-3 py-3 text-right font-cinzel text-xs uppercase tracking-widest text-parchment-faint">D</th>
                  <th className="px-3 py-3 text-right font-cinzel text-xs uppercase tracking-widest text-parchment-faint">GF/GC</th>
                  <th className="px-3 py-3 text-right font-cinzel text-xs uppercase tracking-widest text-parchment-faint hidden sm:table-cell">CAS</th>
                  <th className="px-3 py-3 text-left font-cinzel text-xs uppercase tracking-widest text-parchment-faint hidden md:table-cell">Forma</th>
                </tr>
              </thead>
              <tbody>
                {teamsRows.map((t, i) => (
                  <tr
                    key={t.id}
                    className="border-b border-rim last:border-0 hover:bg-elevated transition-colors"
                  >
                    <td className="px-3 py-2 font-mono text-xs text-parchment-faint text-right">{i + 1}</td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/equipo/${t.id}`}
                        className="font-barlow font-semibold text-sm text-parchment hover:text-gold transition-colors"
                      >
                        {t.name}
                      </Link>
                      <span className="font-mono text-xs text-parchment-faint ml-2">
                        <Link href={`/entrenador/${t.coachId}`} className="hover:text-parchment-dim">
                          {t.coachName}
                        </Link>
                        {t.rosterName && <span> · {t.rosterName}</span>}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-parchment-dim text-right">{t.recordGames ?? 0}</td>
                    <td className="px-3 py-2 font-mono text-xs text-win text-right font-bold">{t.recordWins ?? 0}</td>
                    <td className="px-3 py-2 font-mono text-xs text-parchment-faint text-right">{t.recordTies ?? 0}</td>
                    <td className="px-3 py-2 font-mono text-xs text-loss text-right">{t.recordLosses ?? 0}</td>
                    <td className="px-3 py-2 font-mono text-xs text-parchment-dim text-right whitespace-nowrap">{t.recordTdFor ?? 0}/{t.recordTdAgainst ?? 0}</td>
                    <td className="px-3 py-2 font-mono text-xs text-parchment-dim text-right hidden sm:table-cell">{t.recordCasFor ?? 0}</td>
                    <td className="px-3 py-2 hidden md:table-cell"><FormBadges form={t.form} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent matches */}
      {recentMatches.length > 0 && (
        <div>
          <h3 className="font-cinzel text-sm uppercase tracking-widest text-gold mb-3">
            Últimas Partidas
          </h3>
          <div className="border border-rim overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-rim">
                  <th className="px-3 py-3 text-left font-cinzel text-xs uppercase tracking-widest text-parchment-faint">Fecha</th>
                  <th className="px-3 py-3 text-right font-cinzel text-xs uppercase tracking-widest text-parchment-faint hidden sm:table-cell">Ronda</th>
                  <th className="px-3 py-3 text-right font-cinzel text-xs uppercase tracking-widest text-parchment-faint">Local</th>
                  <th className="px-3 py-3 text-center font-cinzel text-xs uppercase tracking-widest text-parchment-faint">Res.</th>
                  <th className="px-3 py-3 text-left font-cinzel text-xs uppercase tracking-widest text-parchment-faint">Visitante</th>
                </tr>
              </thead>
              <tbody>
                {recentMatches.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-rim last:border-0 hover:bg-elevated transition-colors"
                  >
                    <td className="px-3 py-2 font-mono text-xs text-parchment-faint whitespace-nowrap">{formatDate(m.date)}</td>
                    <td className="px-3 py-2 font-mono text-xs text-parchment-faint text-right hidden sm:table-cell">{m.round ?? "—"}</td>
                    <td className="px-3 py-2 font-barlow text-sm text-parchment text-right">{m.team1Name ?? "—"}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`font-mono text-sm font-bold ${m.winnerCoachId === null ? "text-parchment-dim" : "text-gold"}`}>
                        {m.team1Score ?? "?"} – {m.team2Score ?? "?"}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-barlow text-sm text-parchment">{m.team2Name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
