import { describe, expect, it } from 'vitest';
import { checkResult, cleanNick, nickError } from '../src/lib/leaderboard-rules.ts';
import type { Schedule } from '../src/lib/types.ts';

describe('nicknames', () => {
  it('accepts normal names in any script', () => {
    for (const n of ['Yugi', 'Seto Kaiba', 'dark_magician', 'Jaden.Y', 'Héros', 'Dragão Negro', 'Computador', '遊戯王', 'Kuriboh-42'])
      expect(nickError(n), n).toBeNull();
  });

  it('checks length and characters', () => {
    expect(nickError('ab')).toBe('length');
    expect(nickError('a'.repeat(17))).toBe('length');
    expect(nickError('  ab  ')).toBe('length');
    expect(nickError('_yugi')).toBe('chars');
    expect(nickError('yu<gi>')).toBe('chars');
    expect(nickError('yugi🔥')).toBe('chars');
  });

  it('blocks reserved words and profanity, including simple disguises', () => {
    for (const n of ['Admin', 'Yugidle Team', 'Konami_Official', 'fuck you', 'F.U.C.K', 'sh1tlord', 'Puta', 'cazzone', 'S C H E I S S E'])
      expect(nickError(n), n).toBe('blocked');
  });

  it('cleans whitespace', () => {
    expect(cleanNick('  Seto   Kaiba ')).toBe('Seto Kaiba');
  });
});

describe('result checks', () => {
  const schedule: Schedule = { epoch: '2026-11-04', days: { 'classic:easy': [11, 22, 33] } };
  const ok = { day: 1, mode: 'classic', tier: 'easy', guesses: [5, 9, 22] };

  it('accepts a solved puzzle for today or yesterday', () => {
    expect(checkResult(ok, schedule, 1)).toEqual(ok);
    expect(checkResult(ok, schedule, 2)).toEqual(ok);
  });

  it('rejects other days', () => {
    expect(checkResult(ok, schedule, 3)).toBe('day');
    expect(checkResult(ok, schedule, 0)).toBe('day');
  });

  it('rejects unsolved or wrong answers', () => {
    expect(checkResult({ ...ok, guesses: [22, 5] }, schedule, 1)).toBe('answer');
    expect(checkResult({ ...ok, tier: 'hard' }, schedule, 1)).toBe('answer');
  });

  it('rejects malformed input', () => {
    for (const bad of [null, 'x', { ...ok, mode: 'quiz' }, { ...ok, day: 1.5 }, { ...ok, guesses: [] }, { ...ok, guesses: [22, 22] }, { ...ok, guesses: [-1, 22] }, { ...ok, guesses: Array.from({ length: 501 }, (_, i) => i + 100) }])
      expect(checkResult(bad, schedule, 1)).toBe('shape');
  });
});
