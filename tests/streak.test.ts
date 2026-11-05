import { describe, expect, it } from 'vitest';
import { decodeBackup, encodeBackup } from '../src/lib/backup.ts';
import { advanceStreak, emptyStreak, liveStreak, seedStreak } from '../src/lib/streak.ts';

describe('daily streak', () => {
  it('grows on consecutive days and ignores extra solves on the same day', () => {
    let s = emptyStreak();
    s = advanceStreak(s, 10);
    s = advanceStreak(s, 10);
    s = advanceStreak(s, 11);
    expect(s).toEqual({ streak: 2, maxStreak: 2, lastDay: 11 });
  });

  it('restarts after a missed day but keeps the best', () => {
    let s = { streak: 5, maxStreak: 5, lastDay: 20 };
    s = advanceStreak(s, 22);
    expect(s).toEqual({ streak: 1, maxStreak: 5, lastDay: 22 });
  });

  it('ignores days in the past', () => {
    const s = { streak: 3, maxStreak: 3, lastDay: 20 };
    expect(advanceStreak(s, 19)).toBe(s);
  });

  it('stays alive until the end of the next day', () => {
    const s = { streak: 4, maxStreak: 4, lastDay: 7 };
    expect(liveStreak(s, 7)).toBe(4);
    expect(liveStreak(s, 8)).toBe(4);
    expect(liveStreak(s, 9)).toBe(0);
  });

  it('seeds from per-mode streaks', () => {
    expect(
      seedStreak([
        { streak: 2, maxStreak: 9, lastDay: 30 },
        { streak: 3, maxStreak: 3, lastDay: 31 },
        { streak: 1, maxStreak: 1, lastDay: 31 },
      ]),
    ).toEqual({ streak: 3, maxStreak: 9, lastDay: 31 });
    expect(seedStreak([])).toEqual(emptyStreak());
  });
});

describe('backup codes', () => {
  it('round-trips data, including non-ASCII text', () => {
    const data = { v: 1, settings: { lang: 'fr' }, nick: 'Héros ☕', stats: {} };
    const code = encodeBackup(data);
    expect(code.startsWith('YUGIDLE1-')).toBe(true);
    expect(decodeBackup(`  ${code.slice(0, 20)}\n${code.slice(20)} `)).toEqual(data);
  });

  it('rejects anything else', () => {
    expect(decodeBackup('')).toBeNull();
    expect(decodeBackup('hello')).toBeNull();
    expect(decodeBackup('YUGIDLE1-!!!')).toBeNull();
    expect(decodeBackup(`YUGIDLE1-${btoa('[1,2]')}`)).toBeNull();
  });
});
