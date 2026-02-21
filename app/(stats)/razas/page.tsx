import { db } from "@/lib/db";
import { teams, coaches, eloRatings } from "@/lib/db/schema";
import { desc, eq, isNotNull, sql } from "drizzle-orm";
import PageHeader from "@/components/layout/PageHeader";
import RaceBarChart from "@/components/charts/RaceBarChartWrapper";
import type { RaceBarData } from "@/components/charts/RaceBarChart";

export const revalidate = 3600;

interface RaceRow {
  rosterName: string;
  totalWins: number;
  totalTies: number;
  totalLosses: number;
  totalGames: number;
  tdFor: number;
  tdAgainst: number;
  coachCount: number;
  winPct: number;
}

export default async function RazasPage() {
  const raw = await db
    .select({
      rosterName: teams.rosterName,
      totalWins: sql<number>`cast(sum(${teams.recordWins}) as integer)`,
      totalTies: sql<number>`cast(sum(${teams.recordTies}) as integer)`,
      totalLosses: sql<number>`cast(sum(${teams.recordLosses}) as integer)`,
      totalGames: sql<number>`cast(sum(${teams.recordGames}) as integer)`,
      tdFor: sql<number>`cast(sum(${teams.recordTdFor}) as integer)`,
      tdAgainst: sql<number>`cast(sum(${teams.recordTdAgainst}) as integer)`,
      coachCount: sql<number>`cast(count(distinct ${teams.coachId}) as integer)`,
    })
    .from(teams)
    .where(isNotNull(teams.rosterName))
    .groupBy(teams.rosterName)
    .orderBy(
      desc(
        sql`cast(sum(${teams.recordWins}) as float) / nullif(cast(sum(${teams.recordGames}) as float), 0)`
      )
    );

  const raceRows: RaceRow[] = raw
    .filter((r) => r.rosterName !== null)
    .map((r) => ({
      rosterName: r.rosterName!,
      totalWins: r.totalWins ?? 0,
      totalTies: r.totalTies ?? 0,
      totalLosses: r.totalLosses ?? 0,
      totalGames: r.totalGames ?? 0,
      tdFor: r.tdFor ?? 0,
      tdAgainst: r.tdAgainst ?? 0,
      coachCount: r.coachCount ?? 0,
      winPct:
        r.totalGames && r.totalGames > 0
          ? Math.round(((r.totalWins ?? 0) / r.totalGames) * 1000) / 10
          : 0,
    }));

  // Best coach per race (by current ELO among coaches who played that race)
  const bestCoaches = await db
    .select({
      rosterName: teams.rosterName,
      coachId: teams.coachId,
      coachName: coaches.name,
      rating: eloRatings.rating,
    })
    .from(teams)
    .innerJoin(coaches, eq(teams.coachId, coaches.id))
    .innerJoin(eloRatings, eq(teams.coachId, eloRatings.coachId))
    .where(isNotNull(teams.rosterName))
    .orderBy(desc(eloRatings.rating));

  // Keep only highest-rated coach per race
  const bestByRace = new Map<string, { coachName: string; coachId: number; rating: number }>();
  for (const row of bestCoaches) {
    if (row.rosterName && !bestByRace.has(row.rosterName)) {
      bestByRace.set(row.rosterName, {
        coachName: row.coachName,
        coachId: row.coachId,
        rating: Math.round(row.rating),
      });
    }
  }

  const chartData: RaceBarData[] = raceRows.map((r) => ({
    rosterName: r.rosterName,
    winPct: r.winPct,
  }));

  return (
    <main className="max-w-7xl mx-auto px-6 pb-16">
      <PageHeader
        title="ANÁLISIS POR RAZA"
        subtitle="Rendimiento histórico de cada raza en la liga"
      />

      <div className="border border-rim bg-surface p-4 mb-8">
        <RaceBarChart data={chartData} />
      </div>

      <div className="border border-rim overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-rim">
              <th className="px-4 py-3 text-left font-cinzel text-xs uppercase tracking-widest text-parchment-faint">Raza</th>
              <th className="px-4 py-3 text-right font-cinzel text-xs uppercase tracking-widest text-parchment-faint">Entrenadores</th>
              <th className="px-4 py-3 text-right font-cinzel text-xs uppercase tracking-widest text-parchment-faint">PJ</th>
              <th className="px-4 py-3 text-right font-cinzel text-xs uppercase tracking-widest text-parchment-faint">V</th>
              <th className="px-4 py-3 text-right font-cinzel text-xs uppercase tracking-widest text-parchment-faint">E</th>
              <th className="px-4 py-3 text-right font-cinzel text-xs uppercase tracking-widest text-parchment-faint">D</th>
              <th className="px-4 py-3 text-right font-cinzel text-xs uppercase tracking-widest text-parchment-faint">Win%</th>
              <th className="px-4 py-3 text-right font-cinzel text-xs uppercase tracking-widest text-parchment-faint">GF/GC</th>
              <th className="px-4 py-3 text-left font-cinzel text-xs uppercase tracking-widest text-parchment-faint hidden lg:table-cell">Mejor ELO</th>
            </tr>
          </thead>
          <tbody>
            {raceRows.map((race, i) => {
              const best = bestByRace.get(race.rosterName);
              return (
                <tr
                  key={race.rosterName}
                  className="border-b border-rim last:border-0 hover:bg-elevated transition-colors"
                >
                  <td className="px-4 py-3 font-barlow font-semibold text-base text-parchment">
                    {race.rosterName}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-parchment-dim text-right">
                    {race.coachCount}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-parchment-dim text-right">
                    {race.totalGames}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-win text-right font-bold">
                    {race.totalWins}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-parchment-faint text-right">
                    {race.totalTies}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-loss text-right">
                    {race.totalLosses}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-right">
                    <span className={i < 3 ? "text-gold-bright font-bold" : "text-parchment"}>
                      {race.winPct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-parchment-dim text-right whitespace-nowrap">
                    {race.tdFor}/{race.tdAgainst}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {best ? (
                      <a
                        href={`/entrenador/${best.coachId}`}
                        className="font-barlow text-sm text-parchment-dim hover:text-parchment transition-colors"
                      >
                        {best.coachName}
                        <span className="font-mono text-xs text-gold ml-2">{best.rating}</span>
                      </a>
                    ) : (
                      <span className="text-parchment-faint">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
