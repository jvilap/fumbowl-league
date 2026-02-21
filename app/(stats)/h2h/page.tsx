import { db } from "@/lib/db";
import { matches, coaches, teams, tournaments } from "@/lib/db/schema";
import { eq, or, and, desc, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import PageHeader from "@/components/layout/PageHeader";
import CoachSearch from "@/components/h2h/CoachSearch";

export const revalidate = 1800;

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("es-ES", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

interface Props {
  searchParams: Promise<{ a?: string; b?: string }>;
}

export default async function H2HPage({ searchParams }: Props) {
  const params = await searchParams;
  const aId = params.a ? parseInt(params.a, 10) : null;
  const bId = params.b ? parseInt(params.b, 10) : null;

  // Load coaches for display
  let coachA: { id: number; name: string } | null = null;
  let coachB: { id: number; name: string } | null = null;

  if (aId) {
    const [c] = await db
      .select({ id: coaches.id, name: coaches.name })
      .from(coaches)
      .where(eq(coaches.id, aId))
      .limit(1);
    coachA = c ?? null;
  }

  if (bId) {
    const [c] = await db
      .select({ id: coaches.id, name: coaches.name })
      .from(coaches)
      .where(eq(coaches.id, bId))
      .limit(1);
    coachB = c ?? null;
  }

  // H2H matches when both coaches selected
  let h2hMatches: Array<{
    id: number;
    date: Date | null;
    tournamentName: string | null;
    team1Name: string | null;
    team1Score: number | null;
    team2Name: string | null;
    team2Score: number | null;
    winnerCoachId: number | null;
  }> = [];

  let winsA = 0;
  let winsB = 0;
  let draws = 0;

  if (aId && bId) {
    const team1 = alias(teams, "team1");
    const team2 = alias(teams, "team2");

    h2hMatches = await db
      .select({
        id: matches.id,
        date: matches.date,
        tournamentName: tournaments.name,
        team1Name: team1.name,
        team1Score: matches.team1Score,
        team2Name: team2.name,
        team2Score: matches.team2Score,
        winnerCoachId: matches.winnerCoachId,
      })
      .from(matches)
      .leftJoin(tournaments, eq(matches.tournamentId, tournaments.id))
      .leftJoin(team1, eq(matches.team1Id, team1.id))
      .leftJoin(team2, eq(matches.team2Id, team2.id))
      .where(
        or(
          and(eq(matches.team1CoachId, aId), eq(matches.team2CoachId, bId)),
          and(eq(matches.team1CoachId, bId), eq(matches.team2CoachId, aId))
        )
      )
      .orderBy(desc(matches.date));

    for (const m of h2hMatches) {
      if (m.winnerCoachId === null) draws++;
      else if (m.winnerCoachId === aId) winsA++;
      else winsB++;
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-6 pb-16">
      <PageHeader
        title="HEAD TO HEAD"
        subtitle="Enfrentamientos directos entre dos entrenadores"
      />

      {/* Search inputs */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <CoachSearch
          label={coachA ? coachA.name : "Entrenador A"}
          paramKey="a"
          otherParam={bId ? String(bId) : null}
          otherParamKey="b"
          defaultValue={coachA?.name ?? ""}
        />
        <div className="flex items-end justify-center pb-3 text-gold font-cinzel text-sm font-bold sm:pt-7">
          VS
        </div>
        <CoachSearch
          label={coachB ? coachB.name : "Entrenador B"}
          paramKey="b"
          otherParam={aId ? String(aId) : null}
          otherParamKey="a"
          defaultValue={coachB?.name ?? ""}
        />
      </div>

      {/* Summary */}
      {coachA && coachB && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="border border-rim bg-surface p-4 text-center">
              <p className="font-cinzel text-xs uppercase tracking-widest text-parchment-faint mb-1 truncate">
                {coachA.name}
              </p>
              <p className="font-mono text-4xl font-bold text-win">{winsA}</p>
            </div>
            <div className="border border-rim bg-surface p-4 text-center">
              <p className="font-cinzel text-xs uppercase tracking-widest text-parchment-faint mb-1">
                Empates
              </p>
              <p className="font-mono text-4xl font-bold text-parchment-dim">{draws}</p>
            </div>
            <div className="border border-rim bg-surface p-4 text-center">
              <p className="font-cinzel text-xs uppercase tracking-widest text-parchment-faint mb-1 truncate">
                {coachB.name}
              </p>
              <p className="font-mono text-4xl font-bold text-win">{winsB}</p>
            </div>
          </div>

          <p className="text-center font-mono text-xs text-parchment-faint mb-6">
            {h2hMatches.length} partidos disputados
          </p>

          {h2hMatches.length > 0 ? (
            <div className="border border-rim overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-rim">
                    <th className="px-4 py-3 text-left font-cinzel text-xs uppercase tracking-widest text-parchment-faint">Fecha</th>
                    <th className="px-4 py-3 text-left font-cinzel text-xs uppercase tracking-widest text-parchment-faint hidden sm:table-cell">Torneo</th>
                    <th className="px-4 py-3 text-right font-cinzel text-xs uppercase tracking-widest text-parchment-faint">Local</th>
                    <th className="px-4 py-3 text-center font-cinzel text-xs uppercase tracking-widest text-parchment-faint">Resultado</th>
                    <th className="px-4 py-3 text-left font-cinzel text-xs uppercase tracking-widest text-parchment-faint">Visitante</th>
                  </tr>
                </thead>
                <tbody>
                  {h2hMatches.map((m) => {
                    const isDraw = m.winnerCoachId === null;
                    return (
                      <tr
                        key={m.id}
                        className="border-b border-rim last:border-0 hover:bg-elevated transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-parchment-faint whitespace-nowrap">
                          {formatDate(m.date)}
                        </td>
                        <td className="px-4 py-3 font-barlow text-xs text-parchment-dim hidden sm:table-cell">
                          {m.tournamentName ?? "—"}
                        </td>
                        <td className="px-4 py-3 font-barlow text-sm text-parchment text-right">
                          {m.team1Name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`font-mono text-sm font-bold ${isDraw ? "text-parchment-dim" : "text-gold"}`}
                          >
                            {m.team1Score ?? "?"} – {m.team2Score ?? "?"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-barlow text-sm text-parchment">
                          {m.team2Name ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center font-mono text-sm text-parchment-faint py-8">
              No hay partidos directos entre estos entrenadores
            </p>
          )}
        </>
      )}

      {(!coachA || !coachB) && (
        <p className="text-center font-mono text-sm text-parchment-faint py-12">
          Selecciona dos entrenadores para ver su historial de enfrentamientos
        </p>
      )}
    </main>
  );
}
