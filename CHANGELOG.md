# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-11-04

First public version.

### Added
- **Game modes:** Classic (guess from compared stats), Artwork (zoomed-in art that zooms out with each wrong guess) and Card Text (card text with the name hidden, revealed sentence by sentence).
- **Play types:** a daily puzzle per mode and difficulty (resets at midnight UTC), plus Unlimited practice with a give-up option.
- **Difficulty tiers:** Easy (top ~300 by popularity plus hand-picked classics), Normal (top ~2,000) and Hard (every monster printed in the TCG/OCG). Any monster can always be guessed.
- **Classic columns:** card type, Type, ability, Attribute, Level/Rank/Link, ATK, DEF, release year and TCG ban-list status (Banned / Limited / Semi-Limited / Unlimited). Green/yellow/red cells, with arrows for numbers and ban status.
- **Hints:** archetype after 6 guesses and blurred artwork after 10 (Classic); type line after 5 (Card Text).
- **Stats and sharing:** streaks, best streak, guess distribution, and an emoji grid to share.
- **Languages:** English, Italiano, Français, Deutsch, Português (UI, card names, card texts and game terms).
- **Design:** card-frame colour palette, sticker-style UI, animated wall of monster artwork, custom logo and "Y" favicon, confetti on wins. Respects reduced-motion settings.
- **Data pipeline:** YGOPRODeck import, append-only daily schedule, artwork mirrored once (thumbnails as static files, full art on Cloudflare R2), weekly refresh via GitHub Actions. Cards without artwork stay guess-only until art is available.
- **Open source:** MIT license for the code, plus legal notice and privacy policy.

[0.1.0]: https://github.com/Spyder64-Bit/yugidle/releases/tag/v0.1.0
