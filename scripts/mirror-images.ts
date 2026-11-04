/**
 * Mirrors card artwork from YGOPRODeck once, so players never hotlink their servers.
 *
 *   npm run images                       # all monsters, local only
 *   npm run images -- --tier easy        # only cards in the Easy pool (quick dev setup)
 *   npm run images -- --upload           # also upload art to Cloudflare R2
 *
 * Produces:
 *   public/thumbs/<img>.webp   64px thumbnails (committed, served as static files by Pages)
 *   .cache/img/art/<img>.webp  420px artwork (served by Vite in dev, uploaded to R2 for prod)
 *
 * R2 upload needs env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET.
 * A manifest (manifest.json in the bucket) records uploaded ids so CI only fetches new cards.
 */
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { TIERS, type Monster, type TierName } from '../src/lib/types.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const THUMBS = join(ROOT, 'public/thumbs');
const ART = join(ROOT, '.cache/img/art');
const SRC = 'https://images.ygoprodeck.com/images/cards_cropped';
const UA = 'Yugidle-image-mirror/1.0';
const CONCURRENCY = 4;
const DELAY_MS = 150;

const args = process.argv.slice(2);
const arg = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const tier = (arg('tier') ?? 'hard') as TierName;
const upload = args.includes('--upload');
if (!TIERS.includes(tier)) throw new Error(`Unknown tier ${tier}`);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function r2(): { client: S3Client; bucket: string } {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
    throw new Error('Missing R2_* environment variables (see scripts/mirror-images.ts).');
  }
  return {
    bucket: R2_BUCKET,
    client: new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
    }),
  };
}

async function readManifest(s3: ReturnType<typeof r2>): Promise<Set<number>> {
  try {
    const res = await s3.client.send(new GetObjectCommand({ Bucket: s3.bucket, Key: 'manifest.json' }));
    return new Set(JSON.parse(await res.Body!.transformToString()) as number[]);
  } catch {
    return new Set();
  }
}

async function writeManifest(s3: ReturnType<typeof r2>, ids: Set<number>) {
  await s3.client.send(
    new PutObjectCommand({
      Bucket: s3.bucket,
      Key: 'manifest.json',
      Body: JSON.stringify([...ids].sort((a, b) => a - b)),
      ContentType: 'application/json',
    }),
  );
}

async function download(img: number): Promise<Buffer> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${SRC}/${img}.jpg`, { headers: { 'User-Agent': UA } });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if (res.status === 404 || attempt >= 3) throw new Error(`${img}: HTTP ${res.status}`);
    await sleep(2000 * attempt);
  }
}

async function main() {
  const monsters: Monster[] = JSON.parse(readFileSync(join(ROOT, 'public/data/monsters.json'), 'utf8'));
  const max = TIERS.indexOf(tier);
  const imgs = [...new Set(monsters.filter((m) => m.tier <= max || tier === 'hard').map((m) => m.img))];

  mkdirSync(THUMBS, { recursive: true });
  mkdirSync(ART, { recursive: true });

  const s3 = upload ? r2() : null;
  const uploaded = s3 ? await readManifest(s3) : new Set<number>();

  const todo = imgs.filter((img) => {
    const local = existsSync(join(THUMBS, `${img}.webp`)) && existsSync(join(ART, `${img}.webp`));
    const remoteOk = !s3 || uploaded.has(img);
    // In CI there's no local art cache: a thumb + manifest entry is enough.
    return !(existsSync(join(THUMBS, `${img}.webp`)) && remoteOk && (local || s3));
  });
  console.log(`${imgs.length} images in scope, ${todo.length} to process${s3 ? ' (with R2 upload)' : ''}.`);

  let done = 0;
  let failed = 0;
  const queue = [...todo];

  async function worker() {
    while (queue.length) {
      const img = queue.shift()!;
      try {
        const artPath = join(ART, `${img}.webp`);
        let art: Buffer;
        if (existsSync(artPath)) {
          art = readFileSync(artPath);
        } else {
          const src = await download(img);
          art = await sharp(src).resize(420, 420, { fit: 'cover' }).webp({ quality: 80 }).toBuffer();
          writeFileSync(artPath, art);
          await sleep(DELAY_MS);
        }
        const thumbPath = join(THUMBS, `${img}.webp`);
        if (!existsSync(thumbPath)) {
          await sharp(art).resize(64, 64, { fit: 'cover' }).webp({ quality: 70 }).toFile(thumbPath);
        }
        if (s3 && !uploaded.has(img)) {
          await s3.client.send(
            new PutObjectCommand({
              Bucket: s3.bucket,
              Key: `art/${img}.webp`,
              Body: art,
              ContentType: 'image/webp',
              CacheControl: 'public, max-age=31536000, immutable',
            }),
          );
          uploaded.add(img);
        }
      } catch (e) {
        failed++;
        console.warn(`  ! ${(e as Error).message}`);
      }
      if (++done % 100 === 0) {
        console.log(`  ${done}/${todo.length}`);
        if (s3) await writeManifest(s3, uploaded);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  if (s3) await writeManifest(s3, uploaded);
  console.log(`Done. ${done - failed} ok, ${failed} failed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
