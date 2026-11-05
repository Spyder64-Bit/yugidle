import { decodeBackup, encodeBackup } from './backup.ts';
import type { ResultInput } from './leaderboard-rules.ts';
import { advanceStreak, seedStreak, type DayStreak } from './streak.ts';
import { LANGS, type Lang, type Mode, type TierName } from './types.ts';

export type Play = 'daily' | 'unlimited';

export interface GameState {
  answer: number;
  guesses: number[];
  done: boolean;
  /** Day index for daily games, null for unlimited. */
  day: number | null;
  /** Unlimited only: the player revealed the answer. */
  gaveUp?: boolean;
}

/** Guess-count buckets for the distribution chart. */
export const BUCKETS = ['1', '2', '3', '4', '5', '6-10', '11-20', '21+'] as const;
export function bucketOf(guesses: number): number {
  if (guesses <= 5) return guesses - 1;
  if (guesses <= 10) return 5;
  if (guesses <= 20) return 6;
  return 7;
}

export interface Stats {
  wins: number;
  totalGuesses: number;
  streak: number;
  maxStreak: number;
  /** Last day index won (daily only), -1 if never. */
  lastDay: number;
  dist: number[];
}

export interface Settings {
  lang: Lang;
  mode: Mode;
  tier: TierName;
  play: Play;
  grayscale: boolean;
  seenHelp: boolean;
}

interface Saved {
  v: 1;
  games: Record<string, GameState>;
  stats: Record<string, Stats>;
  settings: Settings;
  /** Global daily streak across all modes and difficulties (added in v0.3.0). */
  daily?: DayStreak;
  /** Leaderboard identity, only after the player opted in (v0.3.0). The token is secret. */
  player?: LbPlayer;
  /** Daily results that could not be sent yet (offline). */
  pending?: ResultInput[];
}

export interface LbPlayer {
  token: string;
  nick: string;
  tag: string;
}

const KEY = 'yugidle:v1';

export const gameKey = (play: Play, mode: Mode, tier: TierName) => `${play}:${mode}:${tier}`;

export const emptyStats = (): Stats => ({
  wins: 0,
  totalGuesses: 0,
  streak: 0,
  maxStreak: 0,
  lastDay: -1,
  dist: BUCKETS.map(() => 0),
});

const defaults = (): Saved => ({
  v: 1,
  games: {},
  stats: {},
  settings: {
    // English by default; visitors switch with the flag picker (the choice is remembered).
    lang: 'en',
    mode: 'classic',
    tier: 'easy',
    play: 'daily',
    grayscale: false,
    seenHelp: false,
  },
});

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const s = JSON.parse(raw) as Saved;
    if (s.v !== 1) return defaults();
    const settings = { ...defaults().settings, ...s.settings };
    if (!LANGS.includes(settings.lang)) settings.lang = 'en';
    const out: Saved = { ...defaults(), ...s, settings };
    // Players from before v0.3.0: start the global streak from their per-mode daily streaks.
    out.daily ??= seedStreak(Object.entries(out.stats).filter(([k]) => k.startsWith('daily:')).map(([, v]) => v));
    return out;
  } catch {
    return defaults();
  }
}

const saved = load();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(saved));
  } catch {
    /* storage full or disabled: ignore */
  }
}

export const getSettings = (): Settings => ({ ...saved.settings });
export function saveSettings(s: Settings) {
  saved.settings = { ...s };
  persist();
}

export const getGame = (key: string): GameState | undefined => saved.games[key];
export function saveGame(key: string, g: GameState) {
  saved.games[key] = { ...g, guesses: [...g.guesses] };
  persist();
}

export const getStats = (key: string): Stats => saved.stats[key] ?? emptyStats();

/** Records a finished game. Streaks only apply to daily games. */
export function recordWin(key: string, guesses: number, day: number | null): Stats {
  const s = { ...getStats(key), dist: [...getStats(key).dist] };
  s.wins++;
  s.totalGuesses += guesses;
  s.dist[bucketOf(guesses)]++;
  if (day !== null) {
    s.streak = s.lastDay === day - 1 ? s.streak + 1 : 1;
    s.maxStreak = Math.max(s.maxStreak, s.streak);
    s.lastDay = day;
    saved.daily = advanceStreak(saved.daily ?? seedStreak([]), day);
  }
  saved.stats[key] = s;
  persist();
  return s;
}

/** Streak to display today: a streak is broken if yesterday's puzzle wasn't solved. */
export function currentStreak(s: Stats, today: number): number {
  return s.lastDay >= today - 1 ? s.streak : 0;
}

export const getDayStreak = (): DayStreak => ({ ...(saved.daily ?? seedStreak([])) });

/** The whole saved state as a backup code (see backup.ts). */
export const exportBackup = (): string => encodeBackup(saved);

/**
 * Restores a backup code, replacing everything saved in this browser. Returns false if the code
 * is invalid. The caller should reload the page so every component picks the new state up.
 */
export function importBackup(code: string): boolean {
  const data = decodeBackup(code);
  if (!data || data.v !== 1 || typeof data.settings !== 'object' || typeof data.stats !== 'object') return false;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export const getPlayer = (): LbPlayer | undefined => (saved.player ? { ...saved.player } : undefined);
export function setPlayer(p: LbPlayer | undefined) {
  saved.player = p;
  if (!p) saved.pending = [];
  persist();
}

export const getPending = (): ResultInput[] => [...(saved.pending ?? [])];
export function setPending(list: ResultInput[]) {
  saved.pending = list.slice(-20);
  persist();
}

/** Finished, solved daily games (any mode/tier) from `minDay` on, as leaderboard results. */
export function solvedDailies(minDay: number): ResultInput[] {
  const out: ResultInput[] = [];
  for (const [key, g] of Object.entries(saved.games)) {
    const [play, mode, tier] = key.split(':') as [Play, Mode, TierName];
    if (play !== 'daily' || !g.done || g.gaveUp || g.day === null || g.day < minDay) continue;
    if (g.guesses[g.guesses.length - 1] !== g.answer) continue;
    out.push({ day: g.day, mode, tier, guesses: [...g.guesses] });
  }
  return out;
}
