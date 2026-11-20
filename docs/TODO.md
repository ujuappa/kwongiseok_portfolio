# To-do: weekend of November 21–22, 2026

The decisions referenced here are listed in [PLAN.md → Open decisions](PLAN.md#open-decisions).

## Before Saturday

- [x] Upgrade Node to 22.23.4 or newer. Astro 7 won't start on 22.18 (`winget upgrade OpenJS.NodeJS.22`).
- [x] Pull `main`. GitHub has one newer commit that removes the leftover patch file and `.DS_Store`.

## Saturday: content and decisions

- [ ] Add project entries for the AI news site, the stock dashboard, and the gakgung simulator.
  - [x] AI News Digest (`ai-news-digest.md`), tagged `newsroom` and marked `active`.
  - [ ] Get a new API for the AI news site. Keep the key in GitHub's secret store, as it is now.
  - [ ] Stock dashboard: tag it `newsroom`. The public version shows delayed or demo market data only, and no API keys go in the repo.
  - [ ] Gakgung simulator.
  - Leave `featured` off on all of them. `featured` is false by default, and the resume projects stay featured.
- [x] Pick the three featured projects: the three on the resume, which are already marked `featured: true`.
- [x] Add the internship entry: Boncom, AI Solutions Intern, July 23 – November 25, 2026.
- [ ] Finish the two internship projects, Drive Tracker and Talent Release Signing. Both are drafts (`draft: true`), hidden from the site. Add details and real dates, then remove `draft`.
  - No Boncom code, data, documents, or screenshots of the real apps. Use mockups with made-up data, or get Boncom's written OK first.
- [x] Rewrite the repeated bullets in Imprint Success DNA and the RAG chatbot. In both, the summary repeats the first bullet.
- [x] Regroup skills by area instead of by level. Rename `level` to `area` in `src/content.config.ts`, `src/components/PlainIndex.astro`, and `src/content/profile.yaml`. Do this before Sunday, because the parachute beat shows skills.
- [ ] Write first entries: five books, three hobbies, three tastes (one each for music, shows, and food), and two notes. Sunday doesn't depend on these.
- [x] Decided: two characters, and the landing is in the middle of the village, surrounded by the buildings.
- [x] Decided: the character pick is required, and returning visitors skip the fall, with a replay button. The signpost can wait for phase 3.
- [x] Run Lighthouse on `/map/`. The plan asks for a performance and accessibility check after each phase. Phase 1 result (Nov 20, local preview): 100 in every category on mobile and desktop.

## Sunday: start phase 2, the fall

- [x] Build the four beats with placeholder shapes and your real content: airplane, freefall, parachute, landing.
  - Two placeholder characters. The Jump button stays disabled until one is picked.
  - Landing: the village center, with placeholder buildings around the landing spot.
  - Store the picked character and a "seen the fall" flag in the browser. Returning visitors start at the landing, with a replay button.
- [x] Add the "skip to ground" button, the always-visible link to the plain index, and the reduced-motion fallback.
- [x] Once the fall is at `/`, remove `canonicalPath="/map/"` from `src/pages/index.astro`.
- [x] Lighthouse on `/` (Nov 20, local, mobile): 100 in every category.
- [ ] Test the pacing on your phone, either through the GitHub Pages URL after a push or with `npm run dev -- --host` and your computer's local IP. Tune `SCROLL_SCREENS` in `src/scenes/fall/fall.ts` (6.5 now) if it feels too long or too short.
- [ ] Confirm two behaviors I assumed:
  - Skipping counts as having seen the fall, so the next visit starts at the landing.
  - Skipping before picking a character lands with no skydiver.
- [x] Stretch: write the `add-content` project skill (`.claude/skills/add-content/SKILL.md`). Its templates were checked with a test build.
