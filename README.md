# Yugidle

[![License: MIT](https://img.shields.io/badge/code-MIT-yellow.svg)](LICENSE) ![Open source](https://img.shields.io/badge/open%20source-%E2%9D%A4-e8459a) ![No tracking](https://img.shields.io/badge/tracking-none-2bd47d)

A free, open-source daily Yu-Gi-Oh! monster guessing game in the style of Wordle, with three modes:

- **Classic**: guess the monster from how your guesses compare (card type, Type, ability, Attribute, Level/Rank/Link, ATK, DEF, year, TCG ban-list status).
- **Artwork**: guess from a zoomed-in crop of the art.
- **Card Text**: guess from the card text, with the name hidden.

Each mode has Easy, Normal and Hard difficulties, played either as the daily puzzle (resets at midnight UTC) or in Unlimited mode. The UI is in EN/IT/FR/DE/PT. The site is fully static: stats live in `localStorage`.

Unofficial, non-commercial fan project, not affiliated with or endorsed by Konami. Card data and images come from [YGOPRODeck](https://ygoprodeck.com/api-guide/). No accounts, no ads, no cookies, no tracking.

## Development

```sh
npm install
npm run data                   # fetch cards from the API → public/data, extend data/schedule.json
npm run images -- --tier easy  # mirror artwork for the Easy pool (quick); omit --tier for all ~9.4k
npm run bg                     # rebuild the background monster wall (public/bg/wall.webp)
npm run brand                  # rebuild logo/favicons from assets/brand/
npm run dev                    # http://localhost:5173
npm test                       # unit tests
npm run check                  # type-check
```

`npm run data -- --cached` reuses the API responses saved in `.cache/api` (works offline).

## How the data works

| Path | What | Committed |
|---|---|---|
| `data/schedule.json` | Daily answers per mode×tier. **Append-only**: already-assigned days never change. | yes |
| `data/tier-overrides.json` | Tier sizes and names forced into Easy/Normal or excluded. | yes |
| `public/data/` | Generated monster list, localized names and card-text shards. | yes |
| `public/thumbs/` | 64px thumbnails, served as static files. | yes |
| `.cache/img/art/` | 420px artwork. Served by Vite in dev and uploaded to R2 for production. | no |

Tiers are ranked by YGOPRODeck view counts (Easy = top 300, Normal = top 2,000, Hard = everything printed in the TCG/OCG). Edit `data/tier-overrides.json` to curate them.

## Deployment ($0)

1. **GitHub**: push this repo. `refresh-data.yml` runs every Monday: it rebuilds data, extends the schedule, uploads new art to R2 and commits.
2. **Cloudflare R2**: create bucket `yugidle-images`. Create an R2 API token (Object Read & Write) and add GitHub secrets `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET=yugidle-images`.
3. **First image upload** (from your machine, with the same env vars): `npm run images -- --upload`.
4. **Cloudflare Pages**: create a project from the GitHub repo with build command `npm run build` and output directory `dist`. `wrangler.toml` binds the bucket as `IMAGES` for `functions/img/[[path]].ts`, which serves `/img/art/*`.
5. Optional: add a custom domain in Pages. If you do, you can also give R2 a custom domain and drop the function.

## License and legal

- **Code:** [MIT](LICENSE). You're free to use, modify and share it.
- **Not covered by the MIT license:** Yu-Gi-Oh! card names, texts and artwork (© Konami), the generated card data derived from YGOPRODeck, and the Yugidle logo and icons. See [LEGAL.md](LEGAL.md).
- **Privacy:** Yugidle stores nothing about you outside your own browser. See [PRIVACY.md](PRIVACY.md).
- **Changes:** see [CHANGELOG.md](CHANGELOG.md). Releases are tagged `vX.Y.Z`.
