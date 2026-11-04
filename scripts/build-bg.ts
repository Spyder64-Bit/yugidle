/**
 * Builds the animated background "monster wall": one atlas image of popular monster
 * artworks (public/bg/wall.webp) + its layout (public/bg/wall.json). A single static
 * file keeps it free to serve and fast to load.
 *
 *   npm run bg      (needs .cache/img/art from `npm run images`)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import type { Monster } from '../src/lib/types.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ART = join(ROOT, '.cache/img/art');
const OUT = join(ROOT, 'public/bg');
const TILE = 160;
const COLS = 10;
const ROWS = 6;

async function main() {
  const monsters: Monster[] = JSON.parse(readFileSync(join(ROOT, 'public/data/monsters.json'), 'utf8'));
  const picks = monsters
    .filter((m) => m.tier === 0 && existsSync(join(ART, `${m.img}.webp`)))
    .sort((a, b) => a.pop - b.pop)
    .slice(0, COLS * ROWS);
  if (picks.length < COLS * ROWS) throw new Error(`Only ${picks.length} artworks available; run npm run images first.`);

  // Shuffle deterministically so similar cards don't cluster.
  picks.sort((a, b) => ((a.id * 2654435761) >>> 0) - ((b.id * 2654435761) >>> 0));

  const composites = await Promise.all(
    picks.map(async (m, i) => ({
      input: await sharp(join(ART, `${m.img}.webp`)).resize(TILE, TILE).toBuffer(),
      left: (i % COLS) * TILE,
      top: Math.floor(i / COLS) * TILE,
    })),
  );

  mkdirSync(OUT, { recursive: true });
  await sharp({
    create: { width: COLS * TILE, height: ROWS * TILE, channels: 3, background: '#000' },
  })
    .composite(composites)
    .webp({ quality: 62 })
    .toFile(join(OUT, 'wall.webp'));
  writeFileSync(join(OUT, 'wall.json'), JSON.stringify({ tile: TILE, cols: COLS, rows: ROWS }));
  console.log(`Background atlas: ${picks.length} monsters → public/bg/wall.webp`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
