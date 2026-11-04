import {
  ABILITIES,
  type Ability,
  type BanStatus,
  type Frame,
  type Monster,
  type TierRank,
} from '../src/lib/types.ts';

/** Subset of the YGOPRODeck v7 card object that we use. */
export interface RawCard {
  id: number;
  name: string;
  type: string;
  frameType: string;
  desc: string;
  race?: string;
  attribute?: string;
  atk?: number | null;
  def?: number | null;
  level?: number;
  linkval?: number;
  archetype?: string;
  banlist_info?: { ban_tcg?: string; ban_ocg?: string; ban_goat?: string };
  typeline?: string[];
  card_images: { id: number }[];
  misc_info?: {
    views?: number;
    tcg_date?: string;
    ocg_date?: string;
    formats?: string[];
  }[];
}

/** typeline entry → frame tag (in display order). */
const FRAME_TAGS: [string, Frame][] = [
  ['Pendulum', 'pendulum'],
  ['Link', 'link'],
  ['Ritual', 'ritual'],
  ['Fusion', 'fusion'],
  ['Xyz', 'xyz'],
  ['Synchro', 'synchro'],
];

export function isMonster(c: RawCard): boolean {
  return (
    c.type.includes('Monster') &&
    !!c.race &&
    !!c.attribute &&
    Array.isArray(c.typeline) &&
    c.typeline.some(Boolean)
  );
}

export function releaseYear(c: RawCard): number | null {
  const m = c.misc_info?.[0];
  const years = [m?.tcg_date, m?.ocg_date]
    .filter((d): d is string => !!d && /^\d{4}/.test(d))
    .map((d) => Number(d.slice(0, 4)));
  return years.length ? Math.min(...years) : null;
}

/** Can this card ever be a daily/unlimited answer? (Released in the real TCG/OCG.) */
export function isAnswerable(c: RawCard): boolean {
  const formats = c.misc_info?.[0]?.formats ?? [];
  return (formats.includes('TCG') || formats.includes('OCG')) && releaseYear(c) !== null;
}

const BAN: Record<string, BanStatus> = { Forbidden: 0, Banned: 0, Limited: 1, 'Semi-Limited': 2 };

/** Copies allowed under the current TCG ban list (cards not on the list are Unlimited). */
export const tcgBan = (c: RawCard): BanStatus => BAN[c.banlist_info?.ban_tcg ?? ''] ?? 3;

export const views = (c: RawCard) => c.misc_info?.[0]?.views ?? 0;

/** Converts a raw card into our Monster shape. tier/pop are filled in later by assignTiers. */
export function normalize(c: RawCard): Monster {
  const tl = new Set(c.typeline);
  const frame: Frame[] = [tl.has('Effect') ? 'effect' : 'non-effect'];
  for (const [k, f] of FRAME_TAGS) if (tl.has(k)) frame.push(f);
  const ability: Ability[] = ABILITIES.filter((a) => tl.has(a));

  const isLink = tl.has('Link');
  const isXyz = tl.has('Xyz');
  const lk = isLink ? 'link' : isXyz ? 'rank' : 'level';
  const lv = isLink ? (c.linkval ?? 0) : (c.level ?? 0);

  const stat = (v: number | null | undefined) => (v == null || v < 0 ? '?' : v);

  return {
    id: c.id,
    name: c.name,
    frame,
    ability,
    race: c.race!,
    attr: c.attribute!,
    lk,
    lv,
    atk: stat(c.atk),
    def: isLink ? null : stat(c.def),
    year: releaseYear(c),
    ban: tcgBan(c),
    arch: c.archetype ?? null,
    img: c.card_images[0]?.id ?? c.id,
    tier: 3,
    pop: 0,
  };
}

export interface TierConfig {
  easySize: number;
  normalSize: number;
  /** English names forced into Easy. */
  easy: string[];
  /** English names forced into Normal (if not already Easy). */
  normal: string[];
  /** English names that can never be an answer. */
  exclude: string[];
}

/**
 * Sets `tier` and `pop` on each monster, ranking answerable cards by views.
 * Cards that aren't answerable (or are excluded) get tier 3 (guess only).
 */
export function assignTiers(
  items: { monster: Monster; raw: RawCard }[],
  cfg: TierConfig,
): void {
  const byViews = [...items].sort((a, b) => views(b.raw) - views(a.raw));
  byViews.forEach((it, i) => (it.monster.pop = i));

  const easy = new Set(cfg.easy);
  const normal = new Set(cfg.normal);
  const exclude = new Set(cfg.exclude);

  let rank = 0;
  for (const { monster, raw } of byViews) {
    if (!isAnswerable(raw) || exclude.has(monster.name)) {
      monster.tier = 3;
      continue;
    }
    let tier: TierRank = rank < cfg.easySize ? 0 : rank < cfg.normalSize ? 1 : 2;
    if (easy.has(monster.name)) tier = 0;
    else if (normal.has(monster.name) && tier > 1) tier = 1;
    monster.tier = tier;
    rank++;
  }
}
