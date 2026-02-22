import {
  pgTable,
  integer,
  text,
  timestamp,
  real,
  jsonb,
  serial,
  boolean,
} from "drizzle-orm/pg-core";

// ─── coaches ────────────────────────────────────────────────────────────────
export const coaches = pgTable("coaches", {
  id: integer("id").primaryKey(), // FUMBBL coachId
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── seasons ─────────────────────────────────────────────────────────────────
export const seasons = pgTable("seasons", {
  id: text("id").primaryKey(), // e.g. "23/24"
  label: text("label").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
});

// ─── tournaments ─────────────────────────────────────────────────────────────
export const tournaments = pgTable("tournaments", {
  id: integer("id").primaryKey(), // FUMBBL tournamentId
  seasonId: text("season_id").references(() => seasons.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // Swiss | RoundRobin | Knockout
  status: text("status").notNull(), // Completed | In Progress
  start: timestamp("start"),
  end: timestamp("end"),
  winnerTeamId: integer("winner_team_id"),
});

// ─── teams ───────────────────────────────────────────────────────────────────
export const teams = pgTable("teams", {
  id: integer("id").primaryKey(), // FUMBBL teamId
  coachId: integer("coach_id")
    .references(() => coaches.id)
    .notNull(),
  seasonId: text("season_id").references(() => seasons.id),
  tournamentId: integer("tournament_id").references(() => tournaments.id),
  name: text("name").notNull(),
  rosterName: text("roster_name"),
  rosterId: integer("roster_id"),
  teamValue: integer("team_value"),
  currentTeamValue: integer("current_team_value"),
  treasury: integer("treasury"),
  fanFactor: integer("fan_factor"),
  rerolls: integer("rerolls"),
  apothecary: boolean("apothecary"),
  recordGames: integer("record_games").default(0),
  recordWins: integer("record_wins").default(0),
  recordTies: integer("record_ties").default(0),
  recordLosses: integer("record_losses").default(0),
  recordTdFor: integer("record_td_for").default(0),
  recordTdAgainst: integer("record_td_against").default(0),
  recordCasFor: integer("record_cas_for").default(0),
  recordCasAgainst: integer("record_cas_against").default(0),
  form: text("form"), // e.g. "WLLWW"
  status: text("status"), // Active | Retired...
});

// ─── players ─────────────────────────────────────────────────────────────────
export const players = pgTable("players", {
  id: integer("id").primaryKey(), // FUMBBL playerId
  teamId: integer("team_id")
    .references(() => teams.id)
    .notNull(),
  number: integer("number"),
  name: text("name").notNull(),
  position: text("position"),
  positionId: integer("position_id"),
  games: integer("games").default(0),
  completions: integer("completions").default(0),
  touchdowns: integer("touchdowns").default(0),
  casualties: integer("casualties").default(0),
  mvps: integer("mvps").default(0),
  spp: integer("spp").default(0),
  skills: jsonb("skills").$type<string[]>().default([]),
  injuries: text("injuries"),
  status: integer("status").default(0), // 0 = active
});

// ─── matches ─────────────────────────────────────────────────────────────────
export const matches = pgTable("matches", {
  id: integer("id").primaryKey(), // FUMBBL matchId
  tournamentId: integer("tournament_id").references(() => tournaments.id),
  round: integer("round"),
  date: timestamp("date"),
  replayId: integer("replay_id"),
  conceded: text("conceded"), // None | team1 | team2
  team1Id: integer("team1_id").references(() => teams.id),
  team1CoachId: integer("team1_coach_id").references(() => coaches.id),
  team1Score: integer("team1_score"),
  team1CasBh: integer("team1_cas_bh").default(0),
  team1CasSi: integer("team1_cas_si").default(0),
  team1CasRip: integer("team1_cas_rip").default(0),
  team2Id: integer("team2_id").references(() => teams.id),
  team2CoachId: integer("team2_coach_id").references(() => coaches.id),
  team2Score: integer("team2_score"),
  team2CasBh: integer("team2_cas_bh").default(0),
  team2CasSi: integer("team2_cas_si").default(0),
  team2CasRip: integer("team2_cas_rip").default(0),
  winnerCoachId: integer("winner_coach_id"), // null = draw
});

// ─── elo_history ─────────────────────────────────────────────────────────────
export const eloHistory = pgTable("elo_history", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id")
    .references(() => coaches.id)
    .notNull(),
  matchId: integer("match_id")
    .references(() => matches.id)
    .notNull(),
  matchDate: timestamp("match_date").notNull(),
  tournamentType: text("tournament_type").notNull(), // Swiss | RoundRobin | Knockout
  eloBefore: real("elo_before").notNull(),
  eloAfter: real("elo_after").notNull(),
  eloAfterCore: real("elo_after_core"),
  eloDelta: real("elo_delta").notNull(),
  opponentCoachId: integer("opponent_coach_id").references(() => coaches.id),
  result: text("result").notNull(), // W | D | L
});

// ─── elo_ratings ─────────────────────────────────────────────────────────────
export const eloRatings = pgTable("elo_ratings", {
  coachId: integer("coach_id")
    .primaryKey()
    .references(() => coaches.id),
  rating: real("rating").notNull().default(1000),
  ratingCore: real("rating_core").default(1000),
  gamesPlayed: integer("games_played").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  ties: integer("ties").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  lastMatchDate: timestamp("last_match_date"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── sync_log ─────────────────────────────────────────────────────────────────
export const syncLog = pgTable("sync_log", {
  id: serial("id").primaryKey(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  finishedAt: timestamp("finished_at"),
  status: text("status").notNull(), // ok | error
  matchesAdded: integer("matches_added").default(0),
  teamsAdded: integer("teams_added").default(0),
  errorMessage: text("error_message"),
});

// ─── Type exports ─────────────────────────────────────────────────────────────
export type Coach = typeof coaches.$inferSelect;
export type Season = typeof seasons.$inferSelect;
export type Tournament = typeof tournaments.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type EloHistoryEntry = typeof eloHistory.$inferSelect;
export type EloRating = typeof eloRatings.$inferSelect;
export type SyncLog = typeof syncLog.$inferSelect;
