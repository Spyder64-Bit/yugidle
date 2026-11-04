/**
 * Turns the original brand art in assets/brand/ into web-ready files in public/brand/.
 *
 *   npm run brand
 */
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp, { type Sharp } from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'assets/brand');
const OUT = join(ROOT, 'public/brand');

/** Trims transparent margins so CSS sizing matches the visible art. */
const trimmed = (file: string) => sharp(join(SRC, file)).trim({ threshold: 5 });

async function main() {
  mkdirSync(OUT, { recursive: true });

  // Header logo (2x the largest display width).
  await (await toSharp(trimmed('logo_main.png'))).resize({ width: 960 }).webp({ quality: 88 }).toFile(join(OUT, 'logo.webp'));

  // Browser icons: the "Y" mark (multi-size .ico + PNG) and an iPhone home-screen icon.
  copyFileSync(join(SRC, 'Y_logo_favicon.ico'), join(ROOT, 'public/favicon.ico'));
  const mark = await toSharp(trimmed('Y_logo_transparent_1024.png'));
  await mark.clone().resize(64, 64, { fit: 'contain', background: '#0000' }).png().toFile(join(OUT, 'favicon-64.png'));
  await mark
    .clone()
    .resize(150, 150, { fit: 'contain', background: '#0000' })
    .extend({ top: 15, bottom: 15, left: 15, right: 15, background: '#1b1240' })
    .flatten({ background: '#1b1240' })
    .png()
    .toFile(join(OUT, 'apple-touch-icon.png'));

  // Link-preview image (1200×630): logo on the site's purple.
  const logo = await (await toSharp(trimmed('logo_main.png'))).resize({ width: 1000 }).png().toBuffer();
  await sharp({ create: { width: 1200, height: 630, channels: 4, background: '#1b1240' } })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(join(OUT, 'og.png'));

  console.log('Brand assets written to public/brand/');
}

/** sharp's trim() result must be materialized before further resizing. */
async function toSharp(s: Sharp): Promise<Sharp> {
  return sharp(await s.png().toBuffer());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
