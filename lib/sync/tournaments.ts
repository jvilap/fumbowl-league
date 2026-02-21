import { eq } from "drizzle-orm";
import { db } from "../db";
import { seasons, tournaments } from "../db/schema";
import { fumbbl } from "../fumbbl/client";
import type { FumbblTournament } from "../fumbbl/types";

const GROUP_ID = 13713;

// Tournaments excluded from sync (abandoned/duplicate)
// 65140 = "PreSeason 2k25" — abandoned after round 1, recreated as 65212
const EXCLUDED_TOURNAMENT_IDS = new Set([65140]);

// Known tournament IDs → season mapping (verified against FUMBBL API)
const TOURNAMENT_SEASON_MAP: Record<number, string> = {
  // Temporada 23/24
  60401: "23/24", // 1 FUMBOWL SWISS
  60872: "23/24", // 3a División
  60873: "23/24", // 2a División
  60874: "23/24", // 1a División
  62306: "23/24", // PLAYOFFS '24
  // Temporada 24/25
  62824: "24/25", // PreSeason 2024
  63297: "24/25", // 6a Div. 2024
  63298: "24/25", // 5a Div. 2024
  63300: "24/25", // 4a Div. 2024
  63301: "24/25", // 3a Div. 2024
  63303: "24/25", // 2a Div. 2024
  63304: "24/25", // 1a Div. 2024
  64486: "24/25", // PLAYOFFS 2k25
  // Temporada 25/26
  65140: "25/26", // PreSeason 2k25
  65212: "25/26", // PreSeason 2025
  65431: "25/26", // 7a Div. 2025
  65433: "25/26", // 6a Div. 2025
  65434: "25/26", // 5a Div. 2025
  65435: "25/26", // 4a Div. 2025
  65436: "25/26", // 3a Div. 2025
  65437: "25/26", // 2a Div. 2025
  65438: "25/26", // 1a Div. 2025
};

/** Maps tournament → our season id, using known IDs with date fallback */
function resolveSeasonId(tournament: FumbblTournament): string | null {
  if (TOURNAMENT_SEASON_MAP[tournament.id]) {
    return TOURNAMENT_SEASON_MAP[tournament.id];
  }

  // Fallback for future tournaments: derive from start date
  // Seasons run September → June: Sep-Dec = year/year+1, Jan-Jun = (year-1)/year
  if (tournament.start) {
    const date = new Date(tournament.start);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-based
    if (month >= 9) {
      return `${String(year).slice(2)}/${String(year + 1).slice(2)}`;
    } else {
      return `${String(year - 1).slice(2)}/${String(year).slice(2)}`;
    }
  }

  return null;
}

async function ensureSeasonsExist() {
  const knownSeasons = [
    { id: "23/24", label: "Temporada 23/24", startDate: new Date("2023-09-01"), endDate: new Date("2024-06-30") },
    { id: "24/25", label: "Temporada 24/25", startDate: new Date("2024-09-01"), endDate: new Date("2025-06-30") },
    { id: "25/26", label: "Temporada 25/26", startDate: new Date("2025-09-01"), endDate: new Date("2026-06-30") },
  ];

  for (const season of knownSeasons) {
    await db
      .insert(seasons)
      .values(season)
      .onConflictDoNothing();
  }
}

export async function syncTournaments(): Promise<{
  upserted: number;
  tournamentList: Awaited<ReturnType<typeof fumbbl.getGroupTournaments>>;
}> {
  await ensureSeasonsExist();

  const tournamentList = await fumbbl.getGroupTournaments(GROUP_ID);

  let upserted = 0;
  for (const t of tournamentList) {
    const seasonId = resolveSeasonId(t);
    await db
      .insert(tournaments)
      .values({
        id: t.id,
        seasonId,
        name: t.name,
        type: t.type,
        status: t.status,
        start: t.start ? new Date(t.start) : null,
        end: t.end ? new Date(t.end) : null,
        winnerTeamId: t.winner?.id ?? null,
      })
      .onConflictDoUpdate({
        target: tournaments.id,
        set: {
          name: t.name,
          status: t.status,
          end: t.end ? new Date(t.end) : null,
          winnerTeamId: t.winner?.id ?? null,
        },
      });
    upserted++;
  }

  const filteredList = tournamentList.filter(
    (t) => !EXCLUDED_TOURNAMENT_IDS.has(t.id)
  );
  return { upserted, tournamentList: filteredList };
}
