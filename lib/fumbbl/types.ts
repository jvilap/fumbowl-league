// ─── FUMBBL API response types ────────────────────────────────────────────────

export interface FumbblTournament {
  id: number;
  name: string;
  type: "Swiss" | "RoundRobin" | "Knockout";
  status: "Completed" | "In Progress" | "Scheduled";
  start: string | null;
  end: string | null;
  season: number; // FUMBBL internal season number (mostly 0, not useful for mapping)
  winner?: {
    id: number;
    name: string;
  } | null;
}

// The API returns a plain array, not a wrapped object
export type FumbblGroupTournamentsResponse = FumbblTournament[];

// ─── Schedule ─────────────────────────────────────────────────────────────────

export interface FumbblScheduleTeam {
  id: number;
  name: string;
}

export interface FumbblScheduleMatchResult {
  id: number; // matchId
  status: "played" | "pending";
  replayId: number | null;
  winner: number | null; // teamId
  teams: Array<{
    id: number;
    score: number;
  }>;
}

export interface FumbblScheduleEntry {
  round: number;
  position: number;
  created: string;
  modified: string;
  result: FumbblScheduleMatchResult | null;
  teams: FumbblScheduleTeam[];
}

export type FumbblScheduleResponse = FumbblScheduleEntry[];

// ─── Match ────────────────────────────────────────────────────────────────────

export interface FumbblMatchCoach {
  id: number;
  name: string;
  rating?: {
    pre?: { r?: number; cr?: number; bracket?: number };
    post?: { r?: number; cr?: number; bracket?: number };
  };
}

export interface FumbblMatchTeam {
  id: number;
  name: string;
  roster: { id: number; name: string };
  coach: FumbblMatchCoach;
  score: number;
  fanfactor: number;
  winnings: number;
  teamValue: number;
  currentTeamValue: number;
  tournamentWeight: number;
  casualties: {
    bh: number; // badly hurt
    si: number; // serious injury
    rip: number; // death
  };
}

export interface FumbblMatch {
  id: number;
  replayId: number | null;
  tournamentId: number;
  date: string;
  time: string;
  conceded: "None" | "team1" | "team2";
  team1: FumbblMatchTeam;
  team2: FumbblMatchTeam;
}

// ─── Team ─────────────────────────────────────────────────────────────────────

export interface FumbblPlayerRecord {
  games: number;
  completions: number;
  touchdowns: number;
  deflections: number;
  interceptions: number;
  casualties: number;
  mvps: number;
  spp: number;
  spent_spp: number;
}

export interface FumbblPlayer {
  id: number;
  number: number;
  name: string;
  status: number; // 0 = active
  position: string;
  positionId: number;
  portrait: string | null;
  gender: string | null;
  record: FumbblPlayerRecord;
  skills: string[];
  injuries: string | null;
  injuryStatus: Array<{
    injury: string;
    lasting: boolean;
    lastMatch: boolean;
  }>;
  skillStatus: {
    status: "none" | "canSkill";
    maxLimit: number;
    tier: number;
  };
}

export interface FumbblTeamRecord {
  games: number;
  wins: number;
  ties: number;
  losses: number;
  form: string;
  td: { delta: number; for: number; against: number };
  cas: { delta: number; for: number; against: number };
}

export interface FumbblTeam {
  id: number;
  name: string;
  status: string;
  coach: { id: number; name: string };
  roster: { id: number; name: string };
  divisionId: number | null;
  division: string | null;
  league: number | null; // groupId
  teamValue: number;
  currentTeamValue: number;
  treasury: number;
  rerolls: number;
  fanFactor: number;
  apothecary: boolean;
  assistantCoaches: number;
  cheerleaders: number;
  record: FumbblTeamRecord;
  seasonInfo?: {
    currentSeason: number;
    gamesPlayedInCurrentSeason: number;
    record: { wins: number; ties: number; losses: number };
  };
  tournament?: {
    id: number;
    opponents: number[];
    mode: string;
  };
  lastMatch?: { id: number };
  players: FumbblPlayer[];
}
