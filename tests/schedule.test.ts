import { describe, expect, it } from 'vitest';
import { dayIndex, extendSchedule } from '../scripts/schedule.ts';
import { MODES, scheduleKey } from '../src/lib/types.ts';

const range = (n: number, from = 0) => Array.from({ length: n }, (_, i) => i + from);
const pools = { easy: range(50), normal: range(200), hard: range(1000) };

describe('extendSchedule', () => {
  it('fills every mode×tier up to today + ahead', () => {
    const s = extendSchedule({ epoch: '2026-11-04', days: {} }, pools, 0, 10);
    for (const k of Object.keys(s.days)) expect(s.days[k]).toHaveLength(11);
    expect(Object.keys(s.days)).toHaveLength(9);
  });

  it('never rewrites assigned days, even when pools change', () => {
    const a = extendSchedule({ epoch: '2026-11-04', days: {} }, pools, 0, 30);
    const changed = { easy: range(60, 500), normal: range(200, 500), hard: range(1000, 500) };
    const b = extendSchedule(a, changed, 5, 30);
    for (const k of Object.keys(a.days)) {
      expect(b.days[k].slice(0, 31)).toEqual(a.days[k]);
      expect(b.days[k]).toHaveLength(36);
    }
  });

  it('avoids recent repeats and same-day duplicates across modes', () => {
    const s = extendSchedule({ epoch: '2026-11-04', days: {} }, pools, 0, 39);
    const easy = s.days[scheduleKey('classic', 'easy')];
    expect(new Set(easy).size).toBe(easy.length); // 40 days < 80% of 50
    for (let d = 0; d < 40; d++) {
      const today = MODES.map((m) => s.days[scheduleKey(m, 'easy')][d]);
      expect(new Set(today).size).toBe(3);
    }
  });

  it('only picks from the pool', () => {
    const s = extendSchedule({ epoch: '2026-11-04', days: {} }, pools, 0, 20);
    for (const id of s.days[scheduleKey('text', 'easy')]) expect(id).toBeLessThan(50);
  });
});

describe('dayIndex', () => {
  it('rolls over at midnight UTC', () => {
    expect(dayIndex('2026-11-04', Date.parse('2026-11-04T23:59:59Z'))).toBe(0);
    expect(dayIndex('2026-11-04', Date.parse('2026-11-05T00:00:00Z'))).toBe(1);
    expect(dayIndex('2026-11-04', Date.parse('2026-11-05T00:30:00+01:00'))).toBe(0);
  });
});
