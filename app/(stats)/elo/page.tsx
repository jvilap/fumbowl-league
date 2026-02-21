import { db } from "@/lib/db";
import { eloRatings, eloHistory, coaches } from "@/lib/db/schema";
import { desc, asc, eq, inArray } from "drizzle-orm";
import dynamic from "next/dynamic";
import PageHeader from "@/components/layout/PageHeader";
import type { EloDataPoint } from "@/components/charts/EloLineChart";

export const revalidate = 3600;

const EloLineChart = dynamic(() => import("@/components/charts/EloLineChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] flex items-center justify-center border border-rim">
      <span className="font-mono text-xs text-parchment-faint">Cargando gráfico…</span>
    </div>
  ),
});

export default async function EloPage() {
  // Top 10 coaches by current rating
  const top10 = await db
    .select({
      coachId: eloRatings.coachId,
      name: coaches.name,
      rating: eloRatings.rating,
    })
    .from(eloRatings)
    .innerJoin(coaches, eq(eloRatings.coachId, coaches.id))
    .orderBy(desc(eloRatings.rating))
    .limit(10);

  const coachIds = top10.map((c) => c.coachId);
  const coachNames = top10.map((c) => c.name);

  // ELO history for those coaches
  const history = await db
    .select({
      coachId: eloHistory.coachId,
      matchDate: eloHistory.matchDate,
      eloAfter: eloHistory.eloAfter,
    })
    .from(eloHistory)
    .where(inArray(eloHistory.coachId, coachIds))
    .orderBy(asc(eloHistory.matchDate));

  // Build name lookup
  const nameById = new Map(top10.map((c) => [c.coachId, c.name]));

  // Pivot: collect all unique dates, build series
  // Use a map from dateStr → { coachName: latestElo }
  const dateMap = new Map<string, Record<string, number>>();

  for (const row of history) {
    const d = row.matchDate
      ? new Date(row.matchDate).toLocaleDateString("es-ES", {
          timeZone: "UTC",
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        })
      : null;
    if (!d) continue;
    const coach = nameById.get(row.coachId);
    if (!coach) continue;

    if (!dateMap.has(d)) dateMap.set(d, {});
    dateMap.get(d)![coach] = Math.round(row.eloAfter);
  }

  // Forward-fill: for each coach, carry forward last known ELO
  const sortedDates = Array.from(dateMap.keys());
  const lastKnown: Record<string, number> = {};
  const chartData: EloDataPoint[] = sortedDates.map((date) => {
    const point = dateMap.get(date)!;
    // Merge with carried values
    const merged: EloDataPoint = { date };
    for (const coach of coachNames) {
      if (point[coach] !== undefined) {
        lastKnown[coach] = point[coach];
      }
      if (lastKnown[coach] !== undefined) {
        merged[coach] = lastKnown[coach];
      }
    }
    return merged;
  });

  return (
    <main className="max-w-7xl mx-auto px-6 pb-16">
      <PageHeader
        title="EVOLUCIÓN ELO"
        subtitle="Historial de rating acumulado — Top 10 entrenadores"
      />

      <div className="border border-rim bg-surface p-4 mb-8">
        <EloLineChart data={chartData} coaches={coachNames} />
      </div>

      <div className="border border-rim">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-rim">
              <th className="px-4 py-3 text-right font-cinzel text-xs uppercase tracking-widest text-parchment-faint">#</th>
              <th className="px-4 py-3 text-left font-cinzel text-xs uppercase tracking-widest text-parchment-faint">Entrenador</th>
              <th className="px-4 py-3 text-right font-cinzel text-xs uppercase tracking-widest text-parchment-faint">ELO Actual</th>
            </tr>
          </thead>
          <tbody>
            {top10.map((coach, i) => (
              <tr key={coach.coachId} className="border-b border-rim last:border-0 hover:bg-elevated transition-colors">
                <td className="px-4 py-3 font-mono text-sm text-parchment-faint text-right">{i + 1}</td>
                <td className="px-4 py-3">
                  <a
                    href={`/entrenador/${coach.coachId}`}
                    className="font-barlow font-semibold text-base text-parchment hover:text-gold transition-colors"
                  >
                    {coach.name}
                  </a>
                </td>
                <td className="px-4 py-3 font-mono text-sm text-gold-bright text-right font-bold">
                  {Math.round(coach.rating)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
