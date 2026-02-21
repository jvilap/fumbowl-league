import { asc, eq } from "drizzle-orm";
import { db } from "../db";
import {
  coaches,
  eloHistory,
  eloRatings,
  matches,
  syncLog,
  tournaments,
} from "../db/schema";
import { syncTournamentMatches } from "./matches";
import { syncTournaments } from "./tournaments";
import { calculateElo, DEFAULT_ELO_CONFIG } from "./elo";
import type { EloMatch } from "./elo";


export interface SyncResult {
  matchesAdded: number;
  teamsAdded: number;
  durationMs: number;
}

/**
 * Full incremental sync:
 * 1. Sync tournaments
 * 2. For each tournament, sync new matches (+ teams)
 * 3. Recalculate ELO from scratch
 * 4. Write sync log
 */
export async function runSync(): Promise<SyncResult> {
  const startedAt = new Date();
  let matchesAdded = 0;
  let teamsAdded = 0;
  let logId: number | undefined;

  // Insert initial sync log entry
  const logEntry = await db
    .insert(syncLog)
    .values({ startedAt, status: "ok" })
    .returning({ id: syncLog.id });
  logId = logEntry[0]?.id;

  try {
    // 1. Sync tournaments
    const { tournamentList } = await syncTournaments();

    // 2. Sync matches per tournament (list already filtered by syncTournaments)
    for (const tournament of tournamentList) {
      // Get season_id from DB (was set during tournament sync)
      const [dbTournament] = await db
        .select({ seasonId: tournaments.seasonId })
        .from(tournaments)
        .where(eq(tournaments.id, tournament.id));

      const seasonId = dbTournament?.seasonId ?? null;

      const result = await syncTournamentMatches(tournament, seasonId);
      matchesAdded += result.matchesAdded;
      teamsAdded += result.teamsAdded;
    }

    // 3. Recalculate ELO from scratch
    await recalculateElo();

    // 4. Update sync log
    const finishedAt = new Date();
    if (logId) {
      await db
        .update(syncLog)
        .set({ finishedAt, status: "ok", matchesAdded, teamsAdded })
        .where(eq(syncLog.id, logId));
    }

    return {
      matchesAdded,
      teamsAdded,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
    };
  } catch (error) {
    const finishedAt = new Date();
    if (logId) {
      await db
        .update(syncLog)
        .set({
          finishedAt,
          status: "error",
          matchesAdded,
          teamsAdded,
          errorMessage:
            error instanceof Error ? error.message : String(error),
        })
        .where(eq(syncLog.id, logId));
    }
    throw error;
  }
}

async function recalculateElo() {
  // Load all matches sorted by date
  const allMatches = await db
    .select({
      id: matches.id,
      date: matches.date,
      tournamentId: matches.tournamentId,
      coach1Id: matches.team1CoachId,
      coach2Id: matches.team2CoachId,
      winnerCoachId: matches.winnerCoachId,
      tournamentType: tournaments.type,
    })
    .from(matches)
    .leftJoin(tournaments, eq(matches.tournamentId, tournaments.id))
    .orderBy(asc(matches.date));

  const eloMatches: EloMatch[] = allMatches
    .filter((m) => m.coach1Id !== null && m.coach2Id !== null && m.date !== null)
    .map((m) => ({
      id: m.id,
      date: m.date!,
      tournamentType: (m.tournamentType ?? "RoundRobin") as
        | "Swiss"
        | "RoundRobin"
        | "Knockout",
      coach1Id: m.coach1Id!,
      coach2Id: m.coach2Id!,
      winnerCoachId: m.winnerCoachId,
    }));

  const { history, ratings } = calculateElo(eloMatches, DEFAULT_ELO_CONFIG);

  // Clear and re-insert elo_history
  await db.delete(eloHistory);
  if (history.length > 0) {
    // Batch inserts in chunks of 500
    const CHUNK = 500;
    for (let i = 0; i < history.length; i += CHUNK) {
      await db.insert(eloHistory).values(history.slice(i, i + CHUNK));
    }
  }

  // Upsert elo_ratings
  for (const r of ratings) {
    await db
      .insert(eloRatings)
      .values({
        coachId: r.coachId,
        rating: r.rating,
        gamesPlayed: r.gamesPlayed,
        wins: r.wins,
        ties: r.ties,
        losses: r.losses,
        lastMatchDate: r.lastMatchDate,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: eloRatings.coachId,
        set: {
          rating: r.rating,
          gamesPlayed: r.gamesPlayed,
          wins: r.wins,
          ties: r.ties,
          losses: r.losses,
          lastMatchDate: r.lastMatchDate,
          updatedAt: new Date(),
        },
      });
  }
}
