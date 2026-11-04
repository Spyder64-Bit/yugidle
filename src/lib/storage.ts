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

function detectLang(): Lang {
  const nav = (globalThis.navigator?.language ?? 'en').slice(0, 2) as Lang;
  return LANGS.includes(nav) ? nav : 'en';
}

const defaults = (): Saved => ({
  v: 1,
  games: {},
  stats: {},
  settings: {
    lang: detectLang(),
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
    return { ...defaults(), ...s, settings: { ...defaults().settings, ...s.settings } };
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
  }
  saved.stats[key] = s;
  persist();
  return s;
}

/** Streak to display today: a streak is broken if yesterday's puzzle wasn't solved. */
export function currentStreak(s: Stats, today: number): number {
  return s.lastDay >= today - 1 ? s.streak : 0;
}
