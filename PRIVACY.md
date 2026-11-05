# Privacy policy

_Last updated: 2026-11-05_

Yugidle is designed to collect **nothing** about you, unless you choose to join the optional leaderboard.

## What we don't do

- No accounts, sign-ups or email addresses.
- No cookies.
- No analytics, tracking pixels, fingerprinting or ads.
- No third-party scripts or fonts: everything is served from the Yugidle site itself.

## What is stored, and where

Your settings (language, mode, difficulty), current games, statistics and daily streak are saved in your own browser's `localStorage`. They never leave your device unless you join the leaderboard (below). Clearing your browser's site data deletes them completely.

**Backup codes** (Statistics → Backup) contain this saved data, encoded as text. The code is only shown to you; nothing is uploaded. If you have joined the leaderboard, the code also contains your secret leaderboard key, so keep it private.

When you press **Share**, the result text is copied to your clipboard or handed to your device's share sheet. Nothing is sent anywhere unless you choose to paste or send it.

## Leaderboard (optional)

The global leaderboard is opt-in. Nothing is sent until you pick a nickname and press **Join**.

When you join, the following is stored in a Cloudflare D1 database:

- the **nickname** you chose (shown publicly with a random 4-character tag);
- a random player ID and a **SHA-256 hash** of the secret key your browser keeps (the key itself is never stored on the server);
- for each **daily** puzzle you solve: the day, mode, difficulty, number of guesses and the time you submitted it, plus running totals (puzzles solved, streak, averages). Unlimited games are never sent.

Your nickname and results are shown publicly in the rankings. To limit spam, the number of new players per network per day is counted using a hash of your IP address salted with a secret; the IP address itself is not stored, and these counters are deleted after one day.

**Leaving:** the leaderboard dialog has a *Leave and delete my data* button that permanently deletes your nickname and all your results. You can also ask for deletion by opening an issue on GitHub. Nicknames that are offensive or impersonate someone may be removed.

## External links

The footer links to GitHub and to [Ko-fi](https://ko-fi.com/spyder64). These are plain links: nothing is loaded from those sites until you click one, and once you're there their own privacy policies apply.

## Hosting

The site is hosted on [Cloudflare Pages](https://pages.cloudflare.com/). Like any web host, Cloudflare processes technical data such as IP addresses and request logs to deliver the site and protect it from abuse. See [Cloudflare's privacy policy](https://www.cloudflare.com/privacypolicy/). Yugidle does not access or use these logs.

## Contact

Questions or requests: open an issue on the project's GitHub repository.
