import { inArray } from "drizzle-orm";
import { db } from "../db";
import { matches, teams } from "../db/schema";
import { fumbbl } from "../fumbbl/client";
import type { FumbblTournament } from "../fumbbl/types";
import { syncTeam } from "./teams";

export interface SyncMatchesResult {
  matchesAdded: number;
  teamsAdded: number;
}

/**
 * For a given tournament, fetches its schedule, finds played matches
 * not yet in the DB, and syncs them (+ their teams).
 */
export async function syncTournamentMatches(
  tournament: FumbblTournament,
  seasonId: string | null
): Promise<SyncMatchesResult> {
  const schedule = await fumbbl.getTournamentSchedule(tournament.id);

  // Collect all played match IDs from the schedule
  const playedEntries = schedule.filter(
    (entry) => entry.result?.status === "played" && entry.result.id
  );

  if (playedEntries.length === 0) {
    return { matchesAdded: 0, teamsAdded: 0 };
  }

  const playedMatchIds = playedEntries.map((e) => e.result!.id);

  // Find which match IDs are already in the DB
  const existingMatches = await db
    .select({ id: matches.id })
    .from(matches)
    .where(inArray(matches.id, playedMatchIds));

  const existingIds = new Set(existingMatches.map((m) => m.id));
  const newEntries = playedEntries.filter(
    (e) => !existingIds.has(e.result!.id)
  );

  let matchesAdded = 0;
  let teamsAdded = 0;

  for (const entry of newEntries) {
    const matchData = await fumbbl.getMatch(entry.result!.id);

    // Ensure both teams exist in DB before inserting the match
    const matchTeamIds = [matchData.team1.id, matchData.team2.id];
    const existingTeams = await db
      .select({ id: teams.id })
      .from(teams)
      .where(inArray(teams.id, matchTeamIds));
    const existingTeamIds = new Set(existingTeams.map((t) => t.id));

    for (const teamSide of [matchData.team1, matchData.team2]) {
      if (!existingTeamIds.has(teamSide.id)) {
        const { isNew } = await syncTeam(teamSide.id, seasonId, tournament.id);
        if (isNew) teamsAdded++;
      }
    }

    // Determine winner
    const t1Score = matchData.team1.score;
    const t2Score = matchData.team2.score;
    let winnerCoachId: number | null = null;
    if (t1Score > t2Score) winnerCoachId = matchData.team1.coach.id;
    else if (t2Score > t1Score) winnerCoachId = matchData.team2.coach.id;

    // Combine date + time
    const matchDate = new Date(`${matchData.date}T${matchData.time ?? "00:00:00"}`);

    await db
      .insert(matches)
      .values({
        id: matchData.id,
        tournamentId: matchData.tournamentId,
        round: entry.round,
        date: matchDate,
        replayId: matchData.replayId ?? null,
        conceded: matchData.conceded === "None" ? null : matchData.conceded,
        team1Id: matchData.team1.id,
        team1CoachId: matchData.team1.coach.id,
        team1Score: matchData.team1.score,
        team1CasBh: matchData.team1.casualties.bh,
        team1CasSi: matchData.team1.casualties.si,
        team1CasRip: matchData.team1.casualties.rip,
        team2Id: matchData.team2.id,
        team2CoachId: matchData.team2.coach.id,
        team2Score: matchData.team2.score,
        team2CasBh: matchData.team2.casualties.bh,
        team2CasSi: matchData.team2.casualties.si,
        team2CasRip: matchData.team2.casualties.rip,
        winnerCoachId,
      })
      .onConflictDoNothing();

    matchesAdded++;
  }

  return { matchesAdded, teamsAdded };
}
