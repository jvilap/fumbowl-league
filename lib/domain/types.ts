// ─── Domain types for the UI layer ────────────────────────────────────────────
// These are derived/flattened views of the DB schema, safe to pass to components.

export interface CoachSummary {
  id: number;
  name: string;
  elo: number;
  gamesPlayed: number;
  wins: number;
  ties: number;
  losses: number;
  lastMatchDate: Date | null;
}

export interface CoachProfile extends CoachSummary {
  eloHistory: EloPoint[];
  teams: TeamSummary[];
  recentMatches: MatchSummary[];
}

export interface EloPoint {
  matchId: number;
  matchDate: Date;
  elo: number;
  eloDelta: number;
  opponentName: string;
  result: "W" | "D" | "L";
}

export interface TeamSummary {
  id: number;
  name: string;
  rosterName: string | null;
  seasonId: string | null;
  tournamentId: number | null;
  wins: number;
  ties: number;
  losses: number;
  tdFor: number;
  tdAgainst: number;
  casFor: number;
  casAgainst: number;
  form: string | null;
  status: string | null;
}

export interface TeamProfile extends TeamSummary {
  coachId: number;
  coachName: string;
  teamValue: number | null;
  currentTeamValue: number | null;
  treasury: number | null;
  fanFactor: number | null;
  rerolls: number | null;
  apothecary: boolean | null;
  players: PlayerSummary[];
  matches: MatchSummary[];
}

export interface PlayerSummary {
  id: number;
  number: number | null;
  name: string;
  position: string | null;
  games: number;
  touchdowns: number;
  casualties: number;
  mvps: number;
  spp: number;
  skills: string[];
  injuries: string | null;
}

export interface MatchSummary {
  id: number;
  date: Date | null;
  round: number | null;
  tournamentId: number | null;
  team1Id: number | null;
  team1Name?: string;
  team1CoachId: number | null;
  team1CoachName?: string;
  team1Score: number | null;
  team2Id: number | null;
  team2Name?: string;
  team2CoachId: number | null;
  team2CoachName?: string;
  team2Score: number | null;
  winnerCoachId: number | null;
}

export interface StandingsRow {
  rank: number;
  teamId: number;
  teamName: string;
  coachId: number;
  coachName: string;
  rosterName: string | null;
  games: number;
  wins: number;
  ties: number;
  losses: number;
  tdFor: number;
  tdAgainst: number;
  tdDelta: number;
  casFor: number;
  casAgainst: number;
  points: number; // 3W + 1T
  form: string | null;
}

export interface TournamentInfo {
  id: number;
  name: string;
  type: "Swiss" | "RoundRobin" | "Knockout";
  status: string;
  seasonId: string | null;
  start: Date | null;
  end: Date | null;
}
