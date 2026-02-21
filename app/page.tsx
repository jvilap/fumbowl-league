import { db } from "@/lib/db";
import { seasons, tournaments, teams, coaches } from "@/lib/db/schema";
import { desc, asc, eq, and, isNotNull, sql } from "drizzle-orm";
import PageHeader from "@/components/layout/PageHeader";
import DivisionTable, {
  type DivisionTeamRow,
} from "@/components/divisions/DivisionTable";

export const revalidate = 3600;

export default async function DivisionesPage() {
  // 1. Active season = most recent with a startDate
  const [activeSeason] = await db
    .select({ id: seasons.id, label: seasons.label })
    .from(seasons)
    .where(isNotNull(seasons.startDate))
    .orderBy(desc(seasons.startDate))
    .limit(1);

  if (!activeSeason) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-16 text-center">
        <p className="font-mono text-parchment-faint text-sm">
          No hay temporada activa
        </p>
      </main>
    );
  }

  // 2. RoundRobin tournaments in active season, ordered by name
  const divTournaments = await db
    .select({ id: tournaments.id, name: tournaments.name })
    .from(tournaments)
    .where(
      and(
        eq(tournaments.seasonId, activeSeason.id),
        eq(tournaments.type, "RoundRobin")
      )
    )
    .orderBy(asc(tournaments.name));

  // 3. For each tournament, fetch teams with coach names
  const divisionsData = await Promise.all(
    divTournaments.map(async (t) => {
      const rows = await db
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
          form: teams.form,
        })
        .from(teams)
        .innerJoin(coaches, eq(teams.coachId, coaches.id))
        .where(
          sql`${teams.id} IN (
            SELECT team1_id FROM matches WHERE tournament_id = ${t.id}
            UNION
            SELECT team2_id FROM matches WHERE tournament_id = ${t.id}
          )`
        )
        .orderBy(desc(teams.recordWins), desc(teams.recordTies));

      const teamRows: DivisionTeamRow[] = rows.map((r) => ({
        id: r.id,
        coachId: r.coachId,
        name: r.name,
        coachName: r.coachName,
        rosterName: r.rosterName,
        recordGames: r.recordGames ?? 0,
        recordWins: r.recordWins ?? 0,
        recordTies: r.recordTies ?? 0,
        recordLosses: r.recordLosses ?? 0,
        recordTdFor: r.recordTdFor ?? 0,
        recordTdAgainst: r.recordTdAgainst ?? 0,
        form: r.form,
      }));

      return { tournament: t, teams: teamRows };
    })
  );

  return (
    <main className="max-w-7xl mx-auto px-6 pb-16">
      <PageHeader
        title="DIVISIONES"
        subtitle={`Clasificaciones — ${activeSeason.label}`}
      />

      {divisionsData.length === 0 ? (
        <p className="text-center font-mono text-parchment-faint text-sm py-8">
          No hay divisiones disponibles
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {divisionsData.map(({ tournament, teams: divTeams }) => (
            <DivisionTable
              key={tournament.id}
              name={tournament.name}
              tournamentId={tournament.id}
              teams={divTeams}
            />
          ))}
        </div>
      )}
    </main>
  );
}
