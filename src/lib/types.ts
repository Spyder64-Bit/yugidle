// Shared between the data scripts (scripts/) and the app (src/).

export const FRAMES = [
  'effect',
  'non-effect',
  'pendulum',
  'link',
  'ritual',
  'fusion',
  'xyz',
  'synchro',
] as const;
export type Frame = (typeof FRAMES)[number];

export const ABILITIES = ['Tuner', 'Flip', 'Gemini', 'Spirit', 'Toon', 'Union'] as const;
export type Ability = (typeof ABILITIES)[number];

export type LvlKind = 'level' | 'rank' | 'link';

export type BanStatus = 0 | 1 | 2 | 3;

export const MODES = ['classic', 'artwork', 'text'] as const;
export type Mode = (typeof MODES)[number];

export const TIERS = ['easy', 'normal', 'hard'] as const;
export type TierName = (typeof TIERS)[number];

/** Tier a card can be an answer in: 0 = Easy+, 1 = Normal+, 2 = Hard only, 3 = never (guess only). */
export type TierRank = 0 | 1 | 2 | 3;

export const LANGS = ['en', 'it', 'fr', 'de', 'pt'] as const;
export type Lang = (typeof LANGS)[number];

/** Number of shards the card texts are split into (text/<lang>/<id % N>.json). */
export const TEXT_SHARDS = 64;

export interface Monster {
  id: number;
  /** English name. Localized names live in names.<lang>.json. */
  name: string;
  frame: Frame[];
  ability: Ability[];
  race: string;
  attr: string;
  lk: LvlKind;
  lv: number;
  atk: number | '?';
  /** null = Link monster (no DEF). */
  def: number | '?' | null;
  year: number | null;
  /** TCG ban list: copies allowed in a deck (0 = Banned, 1 = Limited, 2 = Semi-Limited, 3 = Unlimited). */
  ban: BanStatus;
  arch: string | null;
  /** Image id (the card's main artwork). */
  img: number;
  tier: TierRank;
  /** Popularity rank (0 = most viewed). Used to sort search results. */
  pop: number;
}

export interface Schedule {
  /** UTC date (YYYY-MM-DD) of puzzle #1. */
  epoch: string;
  /** Key `${mode}:${tier}` → card id per day index. Append-only. */
  days: Record<string, number[]>;
}

export const scheduleKey = (mode: Mode, tier: TierName) => `${mode}:${tier}`;

export function tierPool(monsters: Monster[], tier: TierName): Monster[] {
  const max = TIERS.indexOf(tier);
  return monsters.filter((m) => m.tier <= max);
}
