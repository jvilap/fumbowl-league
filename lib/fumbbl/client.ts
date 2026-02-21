import type {
  FumbblGroupTournamentsResponse,
  FumbblMatch,
  FumbblScheduleResponse,
  FumbblTeam,
  FumbblTournament,
} from "./types";

const BASE_URL = "https://fumbbl.com/api";
const RATE_LIMIT_MS = 200;
const MAX_RETRIES = 3;
const CIRCUIT_BREAKER_THRESHOLD = 5;

let lastCallAt = 0;
let consecutiveFailures = 0;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function rateLimitedFetch(url: string): Promise<Response> {
  if (consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
    throw new Error(
      `Circuit breaker open after ${CIRCUIT_BREAKER_THRESHOLD} consecutive failures`
    );
  }

  const now = Date.now();
  const elapsed = now - lastCallAt;
  if (elapsed < RATE_LIMIT_MS) {
    await sleep(RATE_LIMIT_MS - elapsed);
  }
  lastCallAt = Date.now();

  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    const res = await fetch(url);

    if (res.ok) {
      consecutiveFailures = 0;
      return res;
    }

    if (res.status === 429 || res.status >= 500) {
      attempt++;
      const backoff = Math.pow(2, attempt) * 1000;
      console.warn(
        `FUMBBL API ${res.status} — retry ${attempt}/${MAX_RETRIES} in ${backoff}ms`
      );
      await sleep(backoff);
      continue;
    }

    // 4xx other than 429 — not retryable
    consecutiveFailures++;
    throw new Error(`FUMBBL API error ${res.status}: ${url}`);
  }

  consecutiveFailures++;
  throw new Error(`FUMBBL API failed after ${MAX_RETRIES} retries: ${url}`);
}

async function get<T>(path: string): Promise<T> {
  const res = await rateLimitedFetch(`${BASE_URL}${path}`);
  return res.json() as Promise<T>;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const fumbbl = {
  /**
   * Returns all tournaments for a group (league).
   * Group 13713 = Fumbowl League
   */
  async getGroupTournaments(groupId: number): Promise<FumbblTournament[]> {
    // API returns a plain array
    return get<FumbblTournament[]>(`/group/tournaments/${groupId}`);
  },

  /**
   * Returns the schedule (all rounds + results) for a tournament.
   */
  async getTournamentSchedule(
    tournamentId: number
  ): Promise<FumbblScheduleResponse> {
    return get<FumbblScheduleResponse>(
      `/tournament/schedule/${tournamentId}`
    );
  },

  /**
   * Returns full match details.
   */
  async getMatch(matchId: number): Promise<FumbblMatch> {
    return get<FumbblMatch>(`/match/get/${matchId}`);
  },

  /**
   * Returns full team details including players.
   */
  async getTeam(teamId: number): Promise<FumbblTeam> {
    return get<FumbblTeam>(`/team/get/${teamId}`);
  },
};
