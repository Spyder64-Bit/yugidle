-- Yugidle global leaderboard (Cloudflare D1). Opt-in: a row exists only for players who picked a nickname.

CREATE TABLE players (
  id          TEXT PRIMARY KEY,          -- random UUID, never shown in full
  token_hash  TEXT NOT NULL UNIQUE,      -- SHA-256 of the secret key kept in the player's browser
  nick        TEXT NOT NULL,
  created     INTEGER NOT NULL,          -- unix ms
  solved      INTEGER NOT NULL DEFAULT 0,-- daily puzzles solved, all modes
  streak      INTEGER NOT NULL DEFAULT 0,-- days in a row with at least one daily solve
  max_streak  INTEGER NOT NULL DEFAULT 0,
  last_day    INTEGER NOT NULL DEFAULT -1
);
CREATE INDEX players_solved ON players (solved DESC);
CREATE INDEX players_streak ON players (last_day, streak DESC);

-- One row per solved daily puzzle.
CREATE TABLE results (
  player   TEXT NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  day      INTEGER NOT NULL,
  mode     TEXT NOT NULL,
  tier     TEXT NOT NULL,
  guesses  INTEGER NOT NULL,
  ts       INTEGER NOT NULL,              -- unix ms, breaks ties (earlier is better)
  PRIMARY KEY (player, mode, tier, day)
);
CREATE INDEX results_board ON results (day, mode, tier, guesses, ts);

-- Running totals per mode × difficulty, for the average-guesses board.
CREATE TABLE mode_stats (
  player         TEXT NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  mode           TEXT NOT NULL,
  tier           TEXT NOT NULL,
  solved         INTEGER NOT NULL,
  total_guesses  INTEGER NOT NULL,
  best           INTEGER NOT NULL,
  PRIMARY KEY (player, mode, tier)
);
CREATE INDEX mode_stats_board ON mode_stats (mode, tier);

-- Anti-spam: new players per (salted, hashed) IP per day. Rows older than today are deleted.
CREATE TABLE signups (
  ip_hash  TEXT NOT NULL,
  day      INTEGER NOT NULL,
  n        INTEGER NOT NULL,
  PRIMARY KEY (ip_hash, day)
);
