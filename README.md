# Yugidle

[![License: MIT](https://img.shields.io/badge/code-MIT-yellow.svg)](LICENSE) ![Open source](https://img.shields.io/badge/open%20source-%E2%9D%A4-e8459a) ![No tracking](https://img.shields.io/badge/tracking-none-2bd47d) [![Ko-fi](https://img.shields.io/badge/Ko--fi-support%20me-ff5e5b?logo=ko-fi&logoColor=white)](https://ko-fi.com/spyder64)

**▶ Play now: [yugidle-game.pages.dev](https://yugidle-game.pages.dev)**

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

Hosting is Cloudflare Pages (site + one Pages Function) and Cloudflare R2 (full artwork), both on the free tier.

1. **Log in:** `npx wrangler login`, then `npx wrangler whoami` to read your account ID.
2. **R2 bucket:** `npx wrangler r2 bucket create yugidle-images` (enable R2 once in the dashboard if asked).
3. **R2 API token:** dashboard → R2 → *Manage API tokens* → *Object Read & Write*, scoped to `yugidle-images`.
4. **First image upload** (resumable thanks to the bucket manifest):
   ```sh
   R2_ACCOUNT_ID=… R2_ACCESS_KEY_ID=… R2_SECRET_ACCESS_KEY=… R2_BUCKET=yugidle-images npm run images -- --upload
   ```
5. **GitHub secrets** for the weekly refresh: `gh secret set R2_ACCOUNT_ID` (and `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`).
6. **Pages project:** dashboard → Workers & Pages → Create → Pages → *Connect to Git* → this repo. Framework *None*, build command `npm run build`, output `dist`, environment variable `NODE_VERSION=24`. Every push to `main` (including the bot's weekly data commit) deploys automatically. `wrangler.toml` binds the bucket as `IMAGES` for `functions/img/[[path]].ts`, which serves `/img/art/*`; if the binding is missing, add it under Settings → Bindings.
7. **Local production preview:** `npm run build && npx wrangler pages dev dist`.

`public/_headers` sets the CSP and cache rules. If you deploy under a different address, change `SITE_URL` in `src/lib/config.ts` and the URLs in `index.html`.

## Support

Yugidle is free and stays free. If you enjoy it, you can [buy me a coffee on Ko-fi](https://ko-fi.com/spyder64). Tips support my time and the open-source code; they never buy Yu-Gi-Oh! content or features.

## License and legal

- **Code:** [MIT](LICENSE). You're free to use, modify and share it.
- **Not covered by the MIT license:** Yu-Gi-Oh! card names, texts and artwork (© Konami), the generated card data derived from YGOPRODeck, and the Yugidle logo and icons. See [LEGAL.md](LEGAL.md).
- **Privacy:** Yugidle stores nothing about you outside your own browser. See [PRIVACY.md](PRIVACY.md).
- **Changes:** see [CHANGELOG.md](CHANGELOG.md). Releases are tagged `vX.Y.Z`.
