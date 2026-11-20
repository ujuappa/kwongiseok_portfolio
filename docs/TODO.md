# To-do: weekend of November 21–22, 2026

The decisions referenced here are listed in [PLAN.md → Open decisions](PLAN.md#open-decisions).

## Before Saturday

- [ ] Upgrade Node to 22.23.4 or newer. Astro 7 won't start on 22.18 (`winget upgrade OpenJS.NodeJS.LTS`).
- [x] Pull `main`. GitHub has one newer commit that removes the leftover patch file and `.DS_Store`.

## Saturday: content and decisions

- [ ] Add project entries for the AI news site, the stock dashboard, and the gakgung simulator.
  - Leave `featured` off on all three. `featured` is false by default, and the resume projects stay featured.
  - Tag the news site and the dashboard `newsroom`. A schema field can wait until phase 3 builds the newsroom.
  - The public dashboard shows delayed or demo market data only, and no API keys go in the repo.
- [x] Pick the three featured projects: the three on the resume, which are already marked `featured: true`.
- [ ] Add the internship entry in `src/content/experience/` with `kind: internship`, before Sunday's parachute beat. Keep it to your role and what you learned, with nothing proprietary.
- [ ] Later: add projects from the internship. They follow the same rule: describe the work and what you learned, with no employer code, data, documents, or screenshots.
- [x] Rewrite the repeated bullets in Imprint Success DNA and the RAG chatbot. In both, the summary repeats the first bullet.
- [x] Regroup skills by area instead of by level. Rename `level` to `area` in `src/content.config.ts`, `src/components/PlainIndex.astro`, and `src/content/profile.yaml`. Do this before Sunday, because the parachute beat shows skills.
- [ ] Write first entries: five books, three hobbies, three tastes (one each for music, shows, and food), and two notes. Sunday doesn't depend on these.
- [x] Decided: two characters, and the landing is in the middle of the village, surrounded by the buildings.
- [ ] Settle the two remaining phase 2 decisions: optional or required character pick, and skipping the fall on return visits. The signpost can wait for phase 3.
- [x] Run Lighthouse on `/map/`. The plan asks for a performance and accessibility check after each phase. Phase 1 result (Nov 20, local preview): 100 in every category on mobile and desktop.

## Sunday: start phase 2, the fall

- [ ] Build the four beats with placeholder shapes and your real content: airplane, freefall, parachute, landing.
  - Two placeholder characters.
  - Landing: the village center, with placeholder buildings around the landing spot.
- [ ] Add the "skip to ground" button, the always-visible link to the plain index, and the reduced-motion fallback.
- [ ] Once the fall is at `/`, remove `canonicalPath="/map/"` from `src/pages/index.astro`.
- [ ] Test the pacing on your phone, either through the GitHub Pages URL after a push or with `npm run dev -- --host` and your computer's local IP.
- [ ] Stretch: write the `add-content` project skill. Write it last, so it describes the schema after Saturday's changes.
