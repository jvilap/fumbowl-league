// Pure ELO calculator — no DB, no API calls.
// Input: sorted matches array. Output: elo_history rows + elo_ratings snapshot.

export interface EloConfig {
  includePreseason: boolean; // if false, skip Swiss tournaments
  k: number; // K factor, default 32
  initialRating: number; // default 1000
}

export const DEFAULT_ELO_CONFIG: EloConfig = {
  includePreseason: true,
  k: 32,
  initialRating: 1000,
};

export interface EloMatch {
  id: number;
  date: Date;
  tournamentType: "Swiss" | "RoundRobin" | "Knockout";
  coach1Id: number;
  coach2Id: number;
  /** null = draw */
  winnerCoachId: number | null;
}

export interface EloHistoryRow {
  coachId: number;
  matchId: number;
  matchDate: Date;
  tournamentType: string;
  eloBefore: number;
  eloAfter: number;
  eloDelta: number;
  opponentCoachId: number;
  result: "W" | "D" | "L";
}

export interface EloRatingRow {
  coachId: number;
  rating: number;
  gamesPlayed: number;
  wins: number;
  ties: number;
  losses: number;
  lastMatchDate: Date | null;
}

export interface EloResult {
  history: EloHistoryRow[];
  ratings: EloRatingRow[];
}

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Recalculates ELO from scratch for all matches.
 * Matches must be sorted by date ASC.
 */
export function calculateElo(
  matches: EloMatch[],
  config: EloConfig = DEFAULT_ELO_CONFIG
): EloResult {
  const ratings = new Map<number, number>();
  const stats = new Map<
    number,
    {
      gamesPlayed: number;
      wins: number;
      ties: number;
      losses: number;
      lastMatchDate: Date | null;
    }
  >();
  const history: EloHistoryRow[] = [];

  function getRating(coachId: number): number {
    return ratings.get(coachId) ?? config.initialRating;
  }

  function getStats(coachId: number) {
    if (!stats.has(coachId)) {
      stats.set(coachId, {
        gamesPlayed: 0,
        wins: 0,
        ties: 0,
        losses: 0,
        lastMatchDate: null,
      });
    }
    return stats.get(coachId)!;
  }

  for (const match of matches) {
    if (!config.includePreseason && match.tournamentType === "Swiss") {
      continue;
    }

    const ra = getRating(match.coach1Id);
    const rb = getRating(match.coach2Id);

    const ea = expectedScore(ra, rb);
    const eb = expectedScore(rb, ra);

    const isDraw = match.winnerCoachId === null;
    const coach1Wins = match.winnerCoachId === match.coach1Id;

    const sa = isDraw ? 0.5 : coach1Wins ? 1 : 0;
    const sb = isDraw ? 0.5 : coach1Wins ? 0 : 1;

    const newRa = ra + config.k * (sa - ea);
    const newRb = rb + config.k * (sb - eb);

    ratings.set(match.coach1Id, newRa);
    ratings.set(match.coach2Id, newRb);

    // History rows
    const result1: "W" | "D" | "L" = isDraw ? "D" : coach1Wins ? "W" : "L";
    const result2: "W" | "D" | "L" = isDraw ? "D" : coach1Wins ? "L" : "W";

    history.push({
      coachId: match.coach1Id,
      matchId: match.id,
      matchDate: match.date,
      tournamentType: match.tournamentType,
      eloBefore: ra,
      eloAfter: newRa,
      eloDelta: newRa - ra,
      opponentCoachId: match.coach2Id,
      result: result1,
    });

    history.push({
      coachId: match.coach2Id,
      matchId: match.id,
      matchDate: match.date,
      tournamentType: match.tournamentType,
      eloBefore: rb,
      eloAfter: newRb,
      eloDelta: newRb - rb,
      opponentCoachId: match.coach1Id,
      result: result2,
    });

    // Stats
    const s1 = getStats(match.coach1Id);
    const s2 = getStats(match.coach2Id);

    s1.gamesPlayed++;
    s2.gamesPlayed++;
    s1.lastMatchDate = match.date;
    s2.lastMatchDate = match.date;

    if (isDraw) {
      s1.ties++;
      s2.ties++;
    } else if (coach1Wins) {
      s1.wins++;
      s2.losses++;
    } else {
      s1.losses++;
      s2.wins++;
    }
  }

  const ratingRows: EloRatingRow[] = [];
  for (const [coachId, rating] of ratings.entries()) {
    const s = getStats(coachId);
    ratingRows.push({
      coachId,
      rating,
      gamesPlayed: s.gamesPlayed,
      wins: s.wins,
      ties: s.ties,
      losses: s.losses,
      lastMatchDate: s.lastMatchDate,
    });
  }

  return { history, ratings: ratingRows };
}
