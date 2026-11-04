import { describe, expect, it } from 'vitest';
import { assignTiers, isAnswerable, isMonster, normalize, type RawCard } from '../scripts/normalize.ts';

const card = (over: Partial<RawCard>): RawCard => ({
  id: 1,
  name: 'Test',
  type: 'Effect Monster',
  frameType: 'effect',
  desc: '',
  race: 'Dragon',
  attribute: 'DARK',
  atk: 1000,
  def: 1000,
  level: 4,
  typeline: ['Dragon', 'Effect'],
  card_images: [{ id: 1 }],
  misc_info: [{ views: 10, tcg_date: '2010-01-01', formats: ['TCG'] }],
  ...over,
});

describe('normalize', () => {
  it('Normal monster → non-effect, no ability', () => {
    const m = normalize(card({ typeline: ['Dragon', 'Normal'], level: 8, atk: 3000, def: 2500 }));
    expect(m.frame).toEqual(['non-effect']);
    expect(m.ability).toEqual([]);
    expect(m).toMatchObject({ lk: 'level', lv: 8, atk: 3000, def: 2500 });
  });

  it('Link monster → link rating, no DEF', () => {
    const m = normalize(card({ typeline: ['Cyberse', 'Link', 'Effect'], level: 0, linkval: 3, def: null }));
    expect(m.frame).toEqual(['effect', 'link']);
    expect(m).toMatchObject({ lk: 'link', lv: 3, def: null });
  });

  it('non-effect Link monster', () => {
    expect(normalize(card({ typeline: ['Machine', 'Link'], linkval: 3 })).frame).toEqual(['non-effect', 'link']);
  });

  it('Xyz Pendulum → rank, both tags', () => {
    const m = normalize(card({ typeline: ['Dragon', 'Xyz', 'Pendulum', 'Effect'], level: 4 }));
    expect(m.frame).toEqual(['effect', 'pendulum', 'xyz']);
    expect(m).toMatchObject({ lk: 'rank', lv: 4 });
  });

  it('Ritual without effect', () => {
    expect(normalize(card({ typeline: ['Warrior', 'Ritual'] })).frame).toEqual(['non-effect', 'ritual']);
  });

  it('Synchro Tuner, Flip, Gemini abilities', () => {
    expect(normalize(card({ typeline: ['Dragon', 'Synchro', 'Tuner', 'Effect'] })).ability).toEqual(['Tuner']);
    expect(normalize(card({ typeline: ['Insect', 'Flip', 'Tuner', 'Effect'] })).ability).toEqual(['Tuner', 'Flip']);
    expect(normalize(card({ typeline: ['Fiend', 'Gemini', 'Effect'] })).ability).toEqual(['Gemini']);
  });

  it('"?" ATK/DEF', () => {
    const m = normalize(card({ atk: -1, def: -1 }));
    expect(m.atk).toBe('?');
    expect(m.def).toBe('?');
  });

  it('TCG ban status, ignoring OCG/GOAT lists', () => {
    expect(normalize(card({ banlist_info: { ban_tcg: 'Forbidden', ban_ocg: 'Limited' } })).ban).toBe(0);
    expect(normalize(card({ banlist_info: { ban_tcg: 'Limited' } })).ban).toBe(1);
    expect(normalize(card({ banlist_info: { ban_tcg: 'Semi-Limited' } })).ban).toBe(2);
    expect(normalize(card({ banlist_info: { ban_ocg: 'Limited', ban_goat: 'Limited' } })).ban).toBe(3);
    expect(normalize(card({})).ban).toBe(3);
  });

  it('release year = earliest of TCG/OCG', () => {
    const m = normalize(card({ misc_info: [{ tcg_date: '2002-03-08', ocg_date: '1999-03-06' }] }));
    expect(m.year).toBe(1999);
  });
});

describe('filters', () => {
  it('excludes spells, tokens and broken entries', () => {
    expect(isMonster(card({ type: 'Spell Card', race: 'Normal', attribute: undefined }))).toBe(false);
    expect(isMonster(card({ type: 'Token', typeline: undefined }))).toBe(false);
    expect(isMonster(card({ typeline: [''], race: '' }))).toBe(false);
    expect(isMonster(card({}))).toBe(true);
  });

  it('only TCG/OCG cards with a date are answerable', () => {
    expect(isAnswerable(card({}))).toBe(true);
    expect(isAnswerable(card({ misc_info: [{ formats: ['Duel Links'], tcg_date: '2020-01-01' }] }))).toBe(false);
    expect(isAnswerable(card({ misc_info: [{ formats: ['TCG'] }] }))).toBe(false);
  });
});

describe('assignTiers', () => {
  it('ranks by views and applies overrides', () => {
    const raws = [5, 4, 3, 2, 1].map((v, i) =>
      card({ id: i, name: `C${i}`, misc_info: [{ views: v, tcg_date: '2010-01-01', formats: ['TCG'] }] }),
    );
    raws.push(card({ id: 9, name: 'DL', misc_info: [{ views: 100, formats: ['Duel Links'] }] }));
    const items = raws.map((raw) => ({ raw, monster: normalize(raw) }));
    assignTiers(items, { easySize: 1, normalSize: 3, easy: ['C4'], normal: [], exclude: ['C1'] });
    const tier = Object.fromEntries(items.map((i) => [i.monster.name, i.monster.tier]));
    expect(tier).toEqual({ C0: 0, C1: 3, C2: 1, C3: 1, C4: 0, DL: 3 });
    expect(items.find((i) => i.monster.name === 'DL')!.monster.pop).toBe(0);
  });
});
