import type { Monster } from './types.ts';

export type Status = 'hit' | 'partial' | 'miss';
/** Arrow points to where the ANSWER is relative to the guess. */
export type Arrow = 'up' | 'down';
export interface Cell {
  status: Status;
  arrow?: Arrow;
}

export const COLUMNS = ['frame', 'race', 'ability', 'attr', 'level', 'atk', 'def', 'year', 'ban'] as const;
export type Column = (typeof COLUMNS)[number];
export type Row = Record<Column, Cell>;

export function compareSets<T>(guess: readonly T[], answer: readonly T[]): Cell {
  const a = new Set(answer);
  const shared = guess.filter((g) => a.has(g)).length;
  if (shared === a.size && guess.length === a.size) return { status: 'hit' };
  if (shared > 0) return { status: 'partial' };
  return { status: 'miss' };
}

export function compareExact<T>(guess: T, answer: T): Cell {
  return { status: guess === answer ? 'hit' : 'miss' };
}

/** Numbers get arrows; '?' and null (no value) only match themselves. */
export function compareNumber(
  guess: number | '?' | null,
  answer: number | '?' | null,
): Cell {
  if (guess === answer) return { status: 'hit' };
  if (typeof guess === 'number' && typeof answer === 'number') {
    return { status: 'miss', arrow: answer > guess ? 'up' : 'down' };
  }
  return { status: 'miss' };
}

export function compareLevel(guess: Monster, answer: Monster): Cell {
  if (guess.lk === answer.lk && guess.lv === answer.lv) return { status: 'hit' };
  if (guess.lv === answer.lv) return { status: 'partial' }; // same number, different kind
  return { status: 'miss', arrow: answer.lv > guess.lv ? 'up' : 'down' };
}

export function compareMonsters(guess: Monster, answer: Monster): Row {
  return {
    frame: compareSets(guess.frame, answer.frame),
    race: compareExact(guess.race, answer.race),
    ability: compareSets(guess.ability, answer.ability),
    attr: compareExact(guess.attr, answer.attr),
    level: compareLevel(guess, answer),
    atk: compareNumber(guess.atk, answer.atk),
    def: compareNumber(guess.def, answer.def),
    year: compareNumber(guess.year, answer.year),
    // Arrows point towards more/fewer copies allowed (Banned 0 → Unlimited 3).
    ban: compareNumber(guess.ban, answer.ban),
  };
}
