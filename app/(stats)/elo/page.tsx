import { db } from "@/lib/db";
import { eloRatings, eloHistory, coaches, seasons, tournaments, teams, matches } from "@/lib/db/schema";
import { desc, asc, eq, inArray, isNotNull, and, sql } from "drizzle-orm";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import EloLineChart from "@/components/charts/EloLineChartWrapper";
import type { EloDataPoint } from "@/components/charts/EloLineChart";

export const revalidate = 3600;

const activeStyle =
  "font-mono text-xs px-3 py-1 bg-gold text-surface";
const inactiveStyle =
  "font-mono text-xs px-3 py-1 border border-rim text-parchment-faint hover:text-parchment transition-colors";

interface Props {
  searchParams: Promise<{ preseason?: string; division?: string }>;
}

export default async function EloPage({ searchParams }: Props) {
  const { preseason, division } = await searchParams;
  const withPreseason = (preseason ?? "1") !== "0";
  const selectedDivId = division ? parseInt(division, 10) : null;

  // Divisiones activas de la temporada en curso (RoundRobin)
  const [activeSeason] = await db
    .select({ id: seasons.id })
    .from(seasons)
    .where(isNotNull(seasons.startDate))
    .orderBy(desc(seasons.startDate))
    .limit(1);

  const divTournaments = activeSeason
    ? await db
        .select({ id: tournaments.id, name: tournaments.name })
        .from(tournaments)
        .where(
          and(
            eq(tournaments.seasonId, activeSeason.id),
            eq(tournaments.type, "RoundRobin")
          )
        )
        .orderBy(asc(tournaments.name))
    : [];

  // Coaches a mostrar
  let coachIds: number[];
  let coachNames: string[];
  let nameById: Map<number, string>;

  if (selectedDivId) {
    // Coaches que participaron en esta división
    const divisionRows = await db
      .select({ coachId: teams.coachId, coachName: coaches.name })
      .from(teams)
      .innerJoin(coaches, eq(teams.coachId, coaches.id))
      .where(
        sql`${teams.id} IN (
          SELECT team1_id FROM matches WHERE tournament_id = ${selectedDivId}
          UNION
          SELECT team2_id FROM matches WHERE tournament_id = ${selectedDivId}
        )`
      );
    coachIds = divisionRows.map((r) => r.coachId);
    nameById = new Map(divisionRows.map((r) => [r.coachId, r.coachName]));
    coachNames = divisionRows.map((r) => r.coachName);
  } else {
    // Top 10 global
    const ratingCol = withPreseason ? eloRatings.rating : eloRatings.ratingCore;
    const top10 = await db
      .select({
        coachId: eloRatings.coachId,
        name: coaches.name,
        rating: ratingCol,
      })
      .from(eloRatings)
      .innerJoin(coaches, eq(eloRatings.coachId, coaches.id))
      .orderBy(desc(ratingCol))
      .limit(10);
    coachIds = top10.map((c) => c.coachId);
    nameById = new Map(top10.map((c) => [c.coachId, c.name]));
    coachNames = top10.map((c) => c.name);
  }

  // ELO history para los coaches seleccionados
  const historyRows =
    coachIds.length > 0
      ? await db
          .select({
            coachId: eloHistory.coachId,
            matchDate: eloHistory.matchDate,
            eloAfter: withPreseason ? eloHistory.eloAfter : eloHistory.eloAfterCore,
          })
          .from(eloHistory)
          .where(
            withPreseason
              ? inArray(eloHistory.coachId, coachIds)
              : and(
                  inArray(eloHistory.coachId, coachIds),
                  isNotNull(eloHistory.eloAfterCore)
                )
          )
          .orderBy(asc(eloHistory.matchDate))
      : [];

  // Pivot + forward-fill
  const dateMap = new Map<string, Record<string, number>>();
  const dateToTimestamp = new Map<string, number>();

  for (const row of historyRows) {
    const d = row.matchDate
      ? new Date(row.matchDate).toLocaleDateString("es-ES", {
          timeZone: "UTC",
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        })
      : null;
    if (!d) continue;
    const eloVal = row.eloAfter;
    if (eloVal === null) continue;
    const coach = nameById.get(row.coachId);
    if (!coach) continue;

    if (!dateMap.has(d)) dateMap.set(d, {});
    dateMap.get(d)![coach] = Math.round(eloVal);
    if (!dateToTimestamp.has(d)) {
      dateToTimestamp.set(d, new Date(row.matchDate!).getTime());
    }
  }

  const sortedDates = Array.from(dateMap.keys());
  const lastKnown: Record<string, number> = {};
  const chartData: EloDataPoint[] = sortedDates.map((date) => {
    const point = dateMap.get(date)!;
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

  // Season boundary markers
  const allSeasons = await db
    .select({ id: seasons.id, label: seasons.label, startDate: seasons.startDate })
    .from(seasons)
    .where(isNotNull(seasons.startDate))
    .orderBy(asc(seasons.startDate));

  const seasonBoundaries: Array<{ date: string; label: string }> = [];
  for (const season of allSeasons.slice(1)) {
    const ts = new Date(season.startDate!).getTime();
    const boundaryDate = sortedDates.find((d) => (dateToTimestamp.get(d) ?? 0) >= ts);
    if (boundaryDate) {
      seasonBoundaries.push({ date: boundaryDate, label: season.label });
    }
  }

  // URL helpers para mantener ambos params al cambiar uno
  const preseasonSuffix = withPreseason ? "" : "&preseason=0";
  const divisionSuffix = selectedDivId ? `&division=${selectedDivId}` : "";

  const topGlobalHref = preseasonSuffix ? `/elo?${preseasonSuffix.slice(1)}` : "/elo";

  const subtitle = selectedDivId
    ? divTournaments.find((d) => d.id === selectedDivId)?.name ?? "División"
    : "Top 10 entrenadores";

  // Top 10 ratings for the table
  const ratingCol = withPreseason ? eloRatings.rating : eloRatings.ratingCore;
  const tableEntries = selectedDivId
    ? await db
        .select({ coachId: eloRatings.coachId, name: coaches.name, rating: ratingCol })
        .from(eloRatings)
        .innerJoin(coaches, eq(eloRatings.coachId, coaches.id))
        .where(inArray(eloRatings.coachId, coachIds))
        .orderBy(desc(ratingCol))
    : await db
        .select({ coachId: eloRatings.coachId, name: coaches.name, rating: ratingCol })
        .from(eloRatings)
        .innerJoin(coaches, eq(eloRatings.coachId, coaches.id))
        .where(inArray(eloRatings.coachId, coachIds))
        .orderBy(desc(ratingCol));

  return (
    <main className="max-w-7xl mx-auto px-6 pb-16">
      <PageHeader
        title="EVOLUCIÓN ELO"
        subtitle={`Historial de rating acumulado — ${subtitle}`}
      />

      {/* Selector de división */}
      <div className="flex gap-2 flex-wrap mb-4">
        <Link href={topGlobalHref} className={!selectedDivId ? activeStyle : inactiveStyle}>
          Top 10 Global
        </Link>
        {divTournaments.map((d) => (
          <Link
            key={d.id}
            href={`/elo?division=${d.id}${preseasonSuffix}`}
            className={selectedDivId === d.id ? activeStyle : inactiveStyle}
          >
            {d.name}
          </Link>
        ))}
      </div>

      {/* Toggle pretemporada */}
      <div className="flex justify-end gap-2 mb-4">
        <Link
          href={divisionSuffix ? `/elo?${divisionSuffix.slice(1)}` : "/elo"}
          className={withPreseason ? activeStyle : inactiveStyle}
        >
          Con pretemporada
        </Link>
        <Link
          href={`/elo?preseason=0${divisionSuffix}`}
          className={!withPreseason ? activeStyle : inactiveStyle}
        >
          Sin pretemporada
        </Link>
      </div>

      <div className="border border-rim bg-surface p-4 mb-8">
        <EloLineChart data={chartData} coaches={coachNames} seasonBoundaries={seasonBoundaries} />
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
            {tableEntries.map((coach, i) => (
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
                  {Math.round(coach.rating ?? 1000)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
