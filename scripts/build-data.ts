/**
 * Builds the game data from the YGOPRODeck API.
 *
 *   npm run data            # fetch fresh data from the API
 *   npm run data -- --cached  # reuse .cache/api/*.json if present (offline dev)
 *
 * Outputs (all committed, served statically):
 *   public/data/monsters.json, names/<lang>.json, text/<lang>/<shard>.json, schedule.json, meta.json
 *   data/schedule.json (source of truth, append-only)
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGS, TEXT_SHARDS, TIERS, type Lang, type Schedule, type TierName } from '../src/lib/types.ts';
import { assignTiers, isMonster, normalize, type RawCard, type TierConfig } from './normalize.ts';
import { dayIndex, extendSchedule, utcDateString } from './schedule.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, '.cache/api');
const OUT = join(ROOT, 'public/data');
const API = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';
const UA = 'Yugidle-data-builder/1.0';

const useCache = process.argv.includes('--cached');

async function fetchLang(lang: Lang): Promise<RawCard[]> {
  const file = join(CACHE, `${lang}.json`);
  if (useCache && existsSync(file)) {
    console.log(`  ${lang}: from cache`);
    return JSON.parse(readFileSync(file, 'utf8')).data;
  }
  const url = lang === 'en' ? `${API}?misc=yes` : `${API}?language=${lang}`;
  console.log(`  ${lang}: fetching ${url}`);
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  const text = await res.text();
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(file, text);
  // Be polite to the API (limit is 20 req/s; we do 5 requests total).
  await new Promise((r) => setTimeout(r, 500));
  return JSON.parse(text).data;
}

function writeJson(path: string, data: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data));
}

async function main() {
  console.log('Fetching card data…');
  const raw: Record<string, RawCard[]> = {};
  for (const lang of LANGS) raw[lang] = await fetchLang(lang);

  const items = raw.en.filter(isMonster).map((r) => ({ raw: r, monster: normalize(r) }));
  const cfg: TierConfig = JSON.parse(readFileSync(join(ROOT, 'data/tier-overrides.json'), 'utf8'));
  assignTiers(items, cfg);

  // Cards whose artwork hasn't been mirrored yet (e.g. brand-new cards YGOPRODeck has no
  // image for) can still be guessed, but can't be answers until a later refresh finds art.
  const thumbs = join(ROOT, 'public/thumbs');
  if (existsSync(thumbs)) {
    const noArt = items.filter((i) => i.monster.tier < 3 && !existsSync(join(thumbs, `${i.monster.img}.webp`)));
    for (const i of noArt) i.monster.tier = 3;
    if (noArt.length) console.log(`  ${noArt.length} cards without artwork set to guess-only.`);
  }

  const monsters = items.map((i) => i.monster).sort((a, b) => a.id - b.id);
  const answerable = new Set(monsters.filter((m) => m.tier < 3).map((m) => m.id));

  rmSync(OUT, { recursive: true, force: true });
  writeJson(join(OUT, 'monsters.json'), monsters);

  // Localized names + texts (texts only for cards that can be answers).
  const ids = new Set(monsters.map((m) => m.id));
  for (const lang of LANGS) {
    const names: Record<number, string> = {};
    const shards: Record<number, string>[] = Array.from({ length: TEXT_SHARDS }, () => ({}));
    for (const c of raw[lang]) {
      if (!ids.has(c.id)) continue;
      if (lang !== 'en') names[c.id] = c.name;
      if (answerable.has(c.id) && c.desc) shards[c.id % TEXT_SHARDS][c.id] = c.desc;
    }
    if (lang !== 'en') writeJson(join(OUT, `names/${lang}.json`), names);
    shards.forEach((s, i) => writeJson(join(OUT, `text/${lang}/${i}.json`), s));
  }

  // Schedule (append-only source of truth in data/).
  const schedPath = join(ROOT, 'data/schedule.json');
  const now = Date.now();
  const existing: Schedule = existsSync(schedPath)
    ? JSON.parse(readFileSync(schedPath, 'utf8'))
    : { epoch: utcDateString(now), days: {} };
  const pools = Object.fromEntries(
    TIERS.map((t, i) => [t, monsters.filter((m) => m.tier <= i).map((m) => m.id)]),
  ) as Record<TierName, number[]>;
  const schedule = extendSchedule(existing, pools, dayIndex(existing.epoch, now));
  writeFileSync(schedPath, JSON.stringify(schedule));
  writeJson(join(OUT, 'schedule.json'), schedule);

  writeJson(join(OUT, 'meta.json'), { updated: new Date(now).toISOString(), count: monsters.length });

  const counts = TIERS.map((t) => `${t}=${pools[t].length}`).join(' ');
  console.log(`Done: ${monsters.length} monsters (answer pools: ${counts}).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
