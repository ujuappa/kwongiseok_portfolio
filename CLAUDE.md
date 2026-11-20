# CLAUDE.md

Personal portfolio site for Giseok Kwon. The full plan is in [docs/PLAN.md](docs/PLAN.md). Read it before you start a new phase or make a design decision. This file covers only the working rules.

## What the site is

The site has three layers, and all of them read the same content files:

- **The fall:** a scroll-driven skydive (GSAP + ScrollTrigger) at `/`.
- **The village:** a 2D scene whose buildings open sections of the site. The pixel house uses Phaser 4 and Tiled. The library uses Three.js.
- **The plain index:** a fast, text-first page at `/map/`. It's the full-detail fallback for anyone who skips the scenes, and the version search engines index.

## Current phase

Phase 1, Foundation, is done: Astro, the content collections, the plain index, and the GitHub Pages deploy.

Phase 2, the fall, is in progress. The four beats run at `/` with placeholder shapes and real content. What's left: pacing tested on a real phone, and real art. Work on one phase at a time, in the order in docs/PLAN.md → Build phases. Don't start a scene unless asked.

## Commands

- `npm run dev`: dev server at http://localhost:4321/kwongiseok_portfolio/
- `npm run build`: runs `astro check`, then builds to `dist/`
- `npm run check`: type-checks only

Astro 7 needs Node 22.23.4 or newer.

## Content rules

- **One source of truth.** All text lives in `src/content/`. A scene never keeps its own copy of the text.
- **Schemas** are in `src/content.config.ts` and use Zod 4 imported from `astro/zod`. The collections are projects, experience, books, hobbies, tastes, and notes, plus `profile.yaml` for the name, tagline, skills, and links.
- **Every entry** is one Markdown file with `title`, `date`, and `tags` in its frontmatter. Set `draft: true` to hide an entry.
- **Reading content:** go through `src/lib/content.ts`, using `getPublished`, `getFeaturedProjects`, and `getProfile`. These helpers keep sorting and draft filtering in one place.
- **Internal tags:** some tags, such as `newsroom`, place an entry in a village building instead of describing it. They're listed in `INTERNAL_TAGS` in `src/lib/content.ts`, and pages show tags through `publicTags()` so visitors never see them.
- **Featured projects:** at most three projects can have `featured: true`, since they appear as clouds in the fall. The build fails if there are more.
- **Books:** store the Open Library cover ID, not the ISBN. ISBN lookups are rate-limited.
- **Music and shows:** use official embeds only. Never host tracks or cover art.

## Code conventions

- **Internal links and asset paths** go through `url()` from `src/lib/content.ts`. The site is served under the `/kwongiseok_portfolio` base path.
- **Shared frame:** the font and accent color are CSS variables in `src/layouts/Base.astro`. Every interior uses the same exit button, font, and accent color.
- **Libraries load lazily.** GSAP loads only on the fall. Phaser and Three.js load only when their building's door is opened.
- **Link previews:** `Base.astro` writes the Open Graph tags from each page's `title` and `description`. The default image is `public/og.png` (1200×630), a placeholder to replace once the fall has art. Pass `image` to give a page its own preview, and `noindex` to keep a page out of search (the 404 page uses it).
- **Accessibility:** respect `prefers-reduced-motion`, which gets a static summary instead of the animation. Keep "skip to ground" and the link to the plain index visible during the fall.
- **The fall** lives in `src/scenes/fall/`:
  - **Static first.** `Fall.astro` is a complete static summary that works without JavaScript and is what reduced-motion visitors see. An inline script adds `is-animated` before first paint, and `fall.ts` turns the page into the scene. Scene-only CSS sits under `.is-animated`.
  - **States.** `fall.ts` switches between three classes: `is-boarding`, `is-falling` (ScrollTrigger pins and scrubs one timeline), and `is-landed`.
  - **Resets.** Reset the timeline with `park()`, never `invalidate().progress()`. Invalidated tweens don't redraw when rewound.
  - **Pacing.** `SCROLL_SCREENS` in `fall.ts` sets the scroll length.
- **Visitor state:** the picked character and the "seen the fall" flag are in `src/lib/visitor.ts`, stored in `localStorage` under `kg:` keys. The village and pixel house read the same helpers. The inline script in `Fall.astro` repeats the `kg:fall-seen` key name, so change both together.
- **Layout:** follow the folder layout in docs/PLAN.md → Architecture. Scenes go in `src/scenes/<name>/`, shared UI in `src/components/`, and sprites, tiles, and audio in `public/assets/`.
- **Styles:** the village is not pixel art. Only the pixel house is pixel art, and only the library is 3D. The mismatch is deliberate.

## Privacy rules (public repo; every file and its history is visible)

- **Personal details:** no phone number, home address, birthdate, student ID, or personal email anywhere in the repo or on the site. `docs/*.pdf` is gitignored because the resume contains these.
- **Employer material:** no code, data, documents, or screenshots from an employer or other organization. Describe the internship by role and lessons learned.
- **API keys:** none in the repo or in front-end code. Call those APIs through a serverless function. Show delayed or demo market data only.
- **Contact:** use a dedicated address or a contact form.
- **Photos:** strip metadata from photos before adding them.
- **Course work:** check a class's rules before publishing its source code.

## Deploy

`.github/workflows/deploy.yml` builds with `withastro/action` and deploys to GitHub Pages on every push to `main`. The repo's Pages source must be set to **GitHub Actions**. Hosting is still an open decision in the plan (GitHub Pages or Cloudflare Workers). To switch, change `site` and `base` in `astro.config.mjs` and replace the workflow.
