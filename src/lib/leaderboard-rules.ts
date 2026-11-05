/**
 * Leaderboard rules shared by the browser (instant feedback) and the API (enforcement).
 * Pure functions only: no DOM, no Cloudflare APIs.
 */
import { MODES, TIERS, scheduleKey, type Mode, type Schedule, type TierName } from './types.ts';

export const BOARDS = ['today', 'avg', 'total', 'streak'] as const;
export type Board = (typeof BOARDS)[number];

/** Solves needed in a mode × difficulty before a player appears on its average board. */
export const AVG_MIN_SOLVES = 5;
export const BOARD_SIZE = 50;
export const MAX_GUESSES = 500;

export const NICK_MIN = 3;
export const NICK_MAX = 16;

export type NickError = 'length' | 'chars' | 'blocked';

/** Trims and collapses inner whitespace. */
export const cleanNick = (raw: string) => raw.normalize('NFC').trim().replace(/\s+/g, ' ');

// Letters/digits of any script, plus space, underscore, dot and hyphen (not first).
const NICK_RE = /^[\p{L}\p{N}][\p{L}\p{N} _.\-]*$/u;

// Reserved words and common slurs/profanity (EN/IT/FR/DE/PT), matched after normalisation.
// SUBSTRINGS are distinctive enough to match anywhere; WORDS only as a whole word, to avoid
// blocking innocent names (e.g. "computador" contains "puta", "Dragão Negro" is a card name).
const SUBSTRINGS = [
  'admin', 'moderat', 'yugidle', 'konami', 'official', 'support',
  'fuck', 'shit', 'bitch', 'cunt', 'nigg', 'faggot', 'retard', 'whore', 'slut', 'porn', 'hitler', 'nazi', 'rapist',
  'cazzo', 'vaffancul', 'stronz', 'puttan', 'troia', 'frocio', 'coglion', 'minchia', 'negr0',
  'putain', 'encul', 'salope', 'connard', 'pedophil', 'pedofil',
  'scheiss', 'fotze', 'wichser', 'schwuchtel', 'arschloch', 'hurensohn',
  'caralho', 'buceta', 'viado', 'arrombad',
];
const WORDS = ['fag', 'rape', 'puta', 'pute', 'merde', 'merda', 'porra', 'foda', 'hure', 'cul', 'mod', 'staff', 'dick', 'cock', 'pussy', 'ass'];

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', $: 's' };
const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[013457@$]/g, (c) => LEET[c]);

export function nickError(raw: string): NickError | null {
  const nick = cleanNick(raw);
  const len = [...nick].length;
  if (len < NICK_MIN || len > NICK_MAX) return 'length';
  if (!NICK_RE.test(nick)) return 'chars';
  const folded = fold(nick);
  const squashed = folded.replace(/[^\p{L}\p{N}]/gu, '');
  if (SUBSTRINGS.some((w) => squashed.includes(w) || folded.includes(w))) return 'blocked';
  const words = folded.split(/[^\p{L}\p{N}]+/u);
  if (words.some((w) => WORDS.includes(w)) || WORDS.includes(squashed)) return 'blocked';
  return null;
}

export const isMode = (m: unknown): m is Mode => MODES.includes(m as Mode);
export const isTier = (t: unknown): t is TierName => TIERS.includes(t as TierName);
export const isBoard = (b: unknown): b is Board => BOARDS.includes(b as Board);

export interface ResultInput {
  day: number;
  mode: Mode;
  tier: TierName;
  guesses: number[];
}

export type ResultError = 'shape' | 'day' | 'answer';

/**
 * Checks a submitted daily result: well-formed, for today (or yesterday, for games finished
 * just before midnight UTC or sent late), and actually solved (the last guess is the answer).
 */
export function checkResult(body: unknown, schedule: Schedule, today: number): ResultInput | ResultError {
  if (!body || typeof body !== 'object') return 'shape';
  const { day, mode, tier, guesses } = body as Record<string, unknown>;
  if (!Number.isInteger(day) || !isMode(mode) || !isTier(tier)) return 'shape';
  if (!Array.isArray(guesses) || guesses.length < 1 || guesses.length > MAX_GUESSES) return 'shape';
  if (!guesses.every((g) => Number.isSafeInteger(g) && g > 0)) return 'shape';
  if (new Set(guesses).size !== guesses.length) return 'shape';
  const d = day as number;
  if (d !== today && d !== today - 1) return 'day';
  const answer = schedule.days[scheduleKey(mode, tier)]?.[d];
  if (answer === undefined || guesses[guesses.length - 1] !== answer) return 'answer';
  return { day: d, mode, tier, guesses: guesses as number[] };
}
