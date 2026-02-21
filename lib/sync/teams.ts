import { db } from "../db";
import { coaches, players, teams } from "../db/schema";
import { fumbbl } from "../fumbbl/client";
import type { FumbblTeam } from "../fumbbl/types";

/**
 * Upserts a team and its coach and players into the DB.
 * Returns true if the team was newly inserted, false if it already existed.
 */
export async function syncTeam(
  teamId: number,
  seasonId: string | null,
  tournamentId: number | null
): Promise<{ isNew: boolean; teamData: FumbblTeam }> {
  const teamData = await fumbbl.getTeam(teamId);

  // Upsert coach
  await db
    .insert(coaches)
    .values({
      id: teamData.coach.id,
      name: teamData.coach.name,
    })
    .onConflictDoUpdate({
      target: coaches.id,
      set: { name: teamData.coach.name, updatedAt: new Date() },
    });

  // Upsert team
  const result = await db
    .insert(teams)
    .values({
      id: teamData.id,
      coachId: teamData.coach.id,
      seasonId,
      tournamentId,
      name: teamData.name,
      rosterName: teamData.roster.name,
      rosterId: teamData.roster.id,
      teamValue: teamData.teamValue,
      currentTeamValue: teamData.currentTeamValue,
      treasury: teamData.treasury,
      fanFactor: teamData.fanFactor,
      rerolls: teamData.rerolls,
      apothecary: teamData.apothecary,
      recordGames: teamData.record.games,
      recordWins: teamData.record.wins,
      recordTies: teamData.record.ties,
      recordLosses: teamData.record.losses,
      recordTdFor: teamData.record.td.for,
      recordTdAgainst: teamData.record.td.against,
      recordCasFor: teamData.record.cas.for,
      recordCasAgainst: teamData.record.cas.against,
      form: teamData.record.form,
      status: teamData.status,
    })
    .onConflictDoUpdate({
      target: teams.id,
      set: {
        teamValue: teamData.teamValue,
        currentTeamValue: teamData.currentTeamValue,
        treasury: teamData.treasury,
        fanFactor: teamData.fanFactor,
        rerolls: teamData.rerolls,
        apothecary: teamData.apothecary,
        recordGames: teamData.record.games,
        recordWins: teamData.record.wins,
        recordTies: teamData.record.ties,
        recordLosses: teamData.record.losses,
        recordTdFor: teamData.record.td.for,
        recordTdAgainst: teamData.record.td.against,
        recordCasFor: teamData.record.cas.for,
        recordCasAgainst: teamData.record.cas.against,
        form: teamData.record.form,
        status: teamData.status,
      },
    })
    .returning({ id: teams.id });

  const isNew = result.length > 0;

  // Upsert players
  if (teamData.players && teamData.players.length > 0) {
    for (const p of teamData.players) {
      await db
        .insert(players)
        .values({
          id: p.id,
          teamId: teamData.id,
          number: p.number,
          name: p.name,
          position: p.position,
          positionId: p.positionId,
          games: p.record.games,
          completions: p.record.completions,
          touchdowns: p.record.touchdowns,
          casualties: p.record.casualties,
          mvps: p.record.mvps,
          spp: p.record.spp,
          skills: p.skills,
          injuries: p.injuries ?? null,
          status: p.status,
        })
        .onConflictDoUpdate({
          target: players.id,
          set: {
            games: p.record.games,
            completions: p.record.completions,
            touchdowns: p.record.touchdowns,
            casualties: p.record.casualties,
            mvps: p.record.mvps,
            spp: p.record.spp,
            skills: p.skills,
            injuries: p.injuries ?? null,
            status: p.status,
          },
        });
    }
  }

  return { isNew, teamData };
}
