/**
 * Initial historical data load for all 3 seasons.
 * Run locally: npx tsx scripts/seed.ts
 *
 * Requires POSTGRES_URL in .env.local
 * Estimated runtime: ~15 minutes (rate limiting 200ms/call)
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local before anything else
config({ path: resolve(process.cwd(), ".env.local") });

import { syncTournaments } from "../lib/sync/tournaments";
import { syncTournamentMatches } from "../lib/sync/matches";
import { syncTeam } from "../lib/sync/teams";
import { db } from "../lib/db";
import { teams, tournaments } from "../lib/db/schema";
import { eq, isNotNull } from "drizzle-orm";
import { fumbbl } from "../lib/fumbbl/client";

const GROUP_ID = 13713;

async function main() {
  console.log("🏈 Fumbowl League — Initial seed");
  console.log("Connecting to:", process.env.POSTGRES_URL?.slice(0, 30) + "...");

  const start = Date.now();

  // 1. Sync all tournaments
  console.log("\n1/4 Syncing tournaments...");
  const { tournamentList } = await syncTournaments();
  console.log(`   ✓ ${tournamentList.length} tournaments synced`);

  // 2. Sync all matches per tournament
  console.log("\n2/4 Syncing matches (this takes a while)...");
  let totalMatches = 0;
  let totalTeams = 0;

  for (const tournament of tournamentList) {
    const [dbTournament] = await db
      .select({ seasonId: tournaments.seasonId })
      .from(tournaments)
      .where(eq(tournaments.id, tournament.id));

    const seasonId = dbTournament?.seasonId ?? null;

    process.stdout.write(`   → [${tournament.type}] ${tournament.name}... `);
    const result = await syncTournamentMatches(tournament, seasonId);
    totalMatches += result.matchesAdded;
    totalTeams += result.teamsAdded;
    console.log(
      `${result.matchesAdded} matches, ${result.teamsAdded} new teams`
    );
  }

  // 3. Sync teams that appear in schedules but haven't been fully synced yet
  console.log("\n3/4 Ensuring all teams are fully synced...");
  const allTeams = await db
    .select({ id: teams.id, seasonId: teams.seasonId, tournamentId: teams.tournamentId })
    .from(teams);

  let teamsSynced = 0;
  for (const team of allTeams) {
    try {
      await syncTeam(team.id, team.seasonId, team.tournamentId);
      teamsSynced++;
      if (teamsSynced % 10 === 0) {
        process.stdout.write(`   ${teamsSynced}/${allTeams.length} teams...\r`);
      }
    } catch (err) {
      console.warn(`   ⚠ Failed to sync team ${team.id}: ${err}`);
    }
  }
  console.log(`   ✓ ${teamsSynced} teams fully synced`);

  // 4. Run a full sync to recalculate ELO
  console.log("\n4/4 Calculating ELO ratings...");
  const { runSync } = await import("../lib/sync/index");
  // We already synced data — just trigger ELO recalc by running a partial sync
  // that will find no new matches but will recompute ELO
  await runSync();

  const elapsed = Math.round((Date.now() - start) / 1000);
  console.log(`\n✅ Seed complete in ${elapsed}s`);
  console.log(`   Matches added: ${totalMatches}`);
  console.log(`   Teams added:   ${totalTeams}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
