import { describe, expect, it } from 'vitest';
import { compareLevel, compareMonsters, compareNumber, compareSets } from '../src/lib/compare.ts';
import { dailyAnswer, formatCountdown, msUntilNextDay } from '../src/lib/daily.ts';
import { redact, splitClues, REDACTED } from '../src/lib/redact.ts';
import { SearchIndex, norm } from '../src/lib/search.ts';
import { classicGrid, simpleGrid } from '../src/lib/share.ts';
import type { Monster } from '../src/lib/types.ts';

const mon = (over: Partial<Monster>): Monster => ({
  id: 1,
  name: 'X',
  frame: ['effect'],
  ability: [],
  race: 'Dragon',
  attr: 'DARK',
  lk: 'level',
  lv: 4,
  atk: 1000,
  def: 1000,
  year: 2010,
  ban: 3,
  arch: null,
  img: 1,
  tier: 0,
  pop: 0,
  ...over,
});

describe('compare', () => {
  it('sets: hit / partial / miss', () => {
    expect(compareSets(['effect', 'xyz'], ['effect', 'xyz']).status).toBe('hit');
    expect(compareSets(['effect', 'xyz'], ['xyz', 'effect']).status).toBe('hit');
    expect(compareSets(['effect'], ['effect', 'pendulum']).status).toBe('partial');
    expect(compareSets(['effect', 'pendulum'], ['effect']).status).toBe('partial');
    expect(compareSets(['non-effect'], ['effect']).status).toBe('miss');
    expect(compareSets([], []).status).toBe('hit'); // both "None" abilities
    expect(compareSets(['Tuner'], []).status).toBe('miss');
  });

  it('numbers: arrows point to the answer', () => {
    expect(compareNumber(1000, 2000)).toEqual({ status: 'miss', arrow: 'up' });
    expect(compareNumber(3000, 2000)).toEqual({ status: 'miss', arrow: 'down' });
    expect(compareNumber(2000, 2000)).toEqual({ status: 'hit' });
    expect(compareNumber('?', '?')).toEqual({ status: 'hit' });
    expect(compareNumber('?', 2000)).toEqual({ status: 'miss' });
    expect(compareNumber(null, null)).toEqual({ status: 'hit' });
    expect(compareNumber(2000, null)).toEqual({ status: 'miss' });
  });

  it('level / rank / link', () => {
    expect(compareLevel(mon({ lv: 4 }), mon({ lv: 4 })).status).toBe('hit');
    expect(compareLevel(mon({ lk: 'rank', lv: 4 }), mon({ lv: 4 })).status).toBe('partial');
    expect(compareLevel(mon({ lk: 'link', lv: 2 }), mon({ lk: 'rank', lv: 4 }))).toEqual({
      status: 'miss',
      arrow: 'up',
    });
  });

  it('ban status: arrows point to more / fewer allowed copies', () => {
    const row = compareMonsters(mon({ ban: 0 }), mon({ ban: 2 }));
    expect(row.ban).toEqual({ status: 'miss', arrow: 'up' });
    expect(compareMonsters(mon({ ban: 1 }), mon({ ban: 1 })).ban.status).toBe('hit');
  });

  it('full row', () => {
    const row = compareMonsters(mon({ attr: 'LIGHT', atk: 3000 }), mon({}));
    expect(row.attr.status).toBe('miss');
    expect(row.atk).toEqual({ status: 'miss', arrow: 'down' });
    expect(row.race.status).toBe('hit');
  });
});

describe('search', () => {
  const ms = [
    mon({ id: 1, name: 'Blue-Eyes White Dragon', pop: 5 }),
    mon({ id: 2, name: 'Dark Magician', pop: 1 }),
    mon({ id: 3, name: 'Dark Magician Girl', pop: 2 }),
    mon({ id: 4, name: 'Red-Eyes Black Dragon', pop: 3 }),
  ];
  const local: Record<number, string> = { 1: 'Drago Bianco Occhi Blu' };
  const idx = new SearchIndex(ms, (m) => local[m.id] ?? m.name);

  it('normalizes accents and punctuation', () => {
    expect(norm('Blue-Eyes  Wh!te')).toBe('blueeyeswhte');
    expect(norm('Drago Bianco Occhi Blù')).toBe('dragobiancoocchiblu');
  });
  it('prefix beats word-start beats substring, then popularity', () => {
    expect(idx.search('dark', new Set())).toEqual([2, 3]);
    expect(idx.search('dragon', new Set())).toEqual([4, 1]); // word-start matches, by popularity
    expect(idx.search('eyes', new Set())).toEqual([4, 1]);
  });
  it('matches localized and English names, honours exclusions', () => {
    expect(idx.search('drago bianco', new Set())).toEqual([1]);
    expect(idx.search('blue eyes', new Set())).toEqual([1]);
    expect(idx.search('dark', new Set([2]))).toEqual([3]);
  });
});

describe('redact', () => {
  it('hides full names case-insensitively and quoted fragments', () => {
    const t = redact('You can only use the effect of "Elemental HERO Neos" once. "Neos" monsters gain ATK.', [
      'Elemental HERO Neos',
    ]);
    expect(t).not.toMatch(/Neos/);
    expect(t).toContain(REDACTED);
  });
  it('keeps unrelated quotes', () => {
    expect(redact('Add 1 "Polymerization" to your hand.', ['Neos'])).toContain('Polymerization');
  });
  it('splits into clues', () => {
    expect(splitClues('2+ Effect Monsters\r\nGains 500 ATK. If this card is destroyed: draw 1.')).toEqual([
      '2+ Effect Monsters',
      'Gains 500 ATK.',
      'If this card is destroyed: draw 1.',
    ]);
  });
});

describe('daily', () => {
  const ms = [mon({ id: 10 }), mon({ id: 11 }), mon({ id: 12, tier: 2 })];
  it('reads the schedule and falls back when it runs out', () => {
    const s = { epoch: '2026-11-04', days: { 'classic:easy': [11] } };
    expect(dailyAnswer(s, ms, 'classic', 'easy', 0)).toBe(11);
    const fb = dailyAnswer(s, ms, 'classic', 'easy', 5);
    expect([10, 11]).toContain(fb);
    expect(dailyAnswer(s, ms, 'classic', 'easy', 5)).toBe(fb); // deterministic
  });
  it('countdown', () => {
    expect(msUntilNextDay(Date.parse('2026-11-04T23:00:00Z'))).toBe(3_600_000);
    expect(formatCountdown(3_661_000)).toBe('01:01:01');
  });
});

describe('share', () => {
  it('builds grids', () => {
    const row = compareMonsters(mon({ atk: 500 }), mon({}));
    expect(classicGrid([row])).toBe('🟩🟩🟩🟩🟩⬆️🟩🟩🟩');
    expect(simpleGrid(3)).toBe('🟥🟥🟩');
  });
});
