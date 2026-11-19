# Portfolio Website: Project Plan

Last updated: 2026-11-19

## Concept

The site is a personal home base for work, interests, and future art. A scroll-driven skydive delivers the gist, then visitors land in a village they can explore.

- **The fall:** gives every visitor the summary in about ten seconds of scrolling.
- **The village:** each building holds one part of the work or life behind the site.
- **The plain index:** a fast, text-first page for phones, search engines, and anyone who skips the scenes.

All three layers read from the same content files, so adding a project once updates every layer.

## The fall

Scrolling controls altitude, and the fall has four beats.

1. **Airplane:** a plane carrying the site owner's name flies to the center of the screen and holds while clouds drift past. The visitor picks a character and jumps.
2. **Freefall:** the character skydives and project cards pass as clouds. Three featured projects at most.
3. **Parachute:** the chute opens and the fall slows. The open sky shows experience, skills, internship, and education.
4. **Landing:** the character lands and the village comes into view.

Rules for the fall:

- **Character pick:** a default character is pre-selected with a Jump button, so choosing is optional. This is an assumption; see Open decisions.
- **Character count:** two or three. Each needs falling, parachute, and walking sprites.
- **Escape routes:** a "skip to ground" button and a link to the plain index stay visible throughout.
- **Reduced motion:** visitors who have motion turned off get a static summary instead of the animation.
- **Persistence:** the chosen character carries into the village and the pixel house.

## The village

The landing spot is a small 2D scene with six destinations, plus a host, a mailbox, and an empty lot.

| Place | Holds | Style |
| --- | --- | --- |
| Forge | Projects: finished pieces on the wall, the active one on the anvil | Village style |
| Newsroom | The AI news site and the stock dashboard | Village style |
| Library | Books liked and books to read, with no comments | 3D, deliberate mismatch |
| Garden | Hobbies | Village style |
| Pixel house | Kitchen (food and cooking), music studio (music taste), theater room (shows, movies, anime), study (learnings and philosophies) | 2D pixel art, deliberate mismatch |
| Empty lot | A "coming soon" sign for the future art studio | Village style |
| Mailbox | Contact | Village style |
| Host character | The site owner as a character who greets visitors at the landing spot | Redrawn in each building's style |

The mismatch is intentional. The village and four of its buildings share one consistent style. The pixel house and the 3D library look different from the outside, and each has its own style inside.

- **Village style:** it should not be pixel art, or the pixel house stops standing out.
- **Exaggeration:** the pixel house is chunky and visibly low-resolution, and the library has real depth and shadow.
- **Shared frame:** every interior keeps the same exit button, font, and accent color.
- **Host greeting:** one or two skippable lines, then the host points toward the buildings.

## Tech stack

Four libraries cover the build, and each one is loaded only where it is used.

| Piece | Choice | Why |
| --- | --- | --- |
| Site shell and content | Astro (version 7 as of July 2026) | Each project, book, and hobby is one Markdown file, used by both the plain pages and the scenes |
| The fall | [GSAP](https://github.com/greensock/GSAP) with ScrollTrigger | Scroll-linked animation with pinning and scrubbing. GSAP is free, including every plugin |
| Pixel house | [Phaser 4](https://phaser.io) with the Tiled map editor | Loads Tiled maps directly. AI assistants answer Phaser questions more reliably than questions about its rivals |
| 3D library | Three.js | Shelves and book spines are generated from the booklist, so no modeling is needed |
| Hosting | Cloudflare Workers or GitHub Pages | Both host static sites for free. Cloudflare recommends Workers over Pages for new projects |

## Architecture

Content lives in one place and every layer renders it. A scene never holds its own copy of the text.

- **Content collections:** projects, experience, books, hobbies, tastes (music, shows, food), and notes. Each entry is a Markdown file with a title, date, and tags.
- **Plain pages:** every collection has an ordinary HTML page. These are the fallback, the search-engine version, and the first thing built.
- **Scenes:** the fall, the village, the pixel house, and the library each read the same collections and show entries in a shared panel.
- **Lazy loading:** Phaser and Three.js load only when their building's door is opened, so they never slow the fall.
- **Visitor state:** the chosen character is stored in the browser, with no accounts and no server.

Proposed repo layout:

```
src/
  content/        projects, experience, books, hobbies, tastes, notes
  pages/          index (the fall), village, forge, newsroom, library,
                  garden, house, map (plain index)
  scenes/
    fall/         GSAP timeline
    village/      static scene and clickable hotspots
    house/        Phaser game and Tiled maps
    library/      Three.js scene
  components/     shared panel, exit button, host dialogue
public/assets/    sprites, tilesets, audio
docs/PLAN.md      this plan
.claude/skills/   add-content, village-style
```

## Build phases

The build runs in six phases, and each one ends with a complete, deployable site. Time estimates assume weekend work.

1. **Foundation (half a day):** set up the repo, Astro, the content collections, and automatic deploys. Ship the plain index with real content.
2. **The fall (one to two weekends):** the airplane and name, the character pick, project clouds in freefall, and the experience section under the parachute.
3. **The village (one weekend):** a static scene with clickable buildings, the host's greeting, the mailbox, and the empty lot. Each building opens its plain page for now.
4. **Pixel house (two to three weekends):** a walkable Phaser scene with the kitchen, music studio, theater room, and study. Objects open panels fed by the content files.
5. **3D library (about two weekends):** generated shelves, click a spine to read the note on that book, and a plain list for devices without 3D support.
6. **Later:** interiors for the forge, newsroom, and garden, a walkable village, and original art replacing the asset packs.

After each phase, check performance and accessibility before starting the next.

## Assets

Free packs cover the first version, with one paid exception worth considering.

| Need | Source | License |
| --- | --- | --- |
| Village exterior | [Kenney Sketch Town](https://kenney.nl/assets/sketch-town) | CC0, 340 files, isometric sketch style |
| Pixel characters and tiles | [Kenney Tiny Town](https://kenney.nl/assets/tiny-town) and [RPG Urban Pack](https://kenney.nl/assets/rpg-urban-pack) | CC0, 16×16 tiles |
| Pixel house furniture | [LimeZu Modern Interiors](https://limezu.itch.io/moderninteriors/devlog/207713/free-version-overview) | Free version is private use only. The full version costs $1.50 or more |
| Book covers | [Open Library Covers API](https://openlibrary.org/dev/docs/api/covers) | Free, with usage conditions |

- **One style per scene:** pick packs with the same pixel size and palette inside a scene, or it looks stitched together.
- **Modern Interiors:** the best fit for a kitchen, studio, and theater, but a public site needs the paid version. Kenney's indoor tiles are the free, plainer alternative.
- **Book covers:** load covers directly from Open Library's server and link back to it. ISBN lookups are limited to 100 requests per IP every five minutes, so store each book's cover ID instead.
- **Book spines:** generate spines from the title and a color, and show the real cover only in the detail panel.
- **Inspiration, not copies:** the Pokémon, Zelda, and Animal Crossing references are for mood only. Use original or openly licensed sprites.
- **Music and shows:** use official embeds rather than hosted tracks or cover art.

## Claude tools and skills

Claude Code is the main build tool, and skills give it reliable knowledge of each library.

- **How skills work:** a skill is a folder with a SKILL.md file. Project skills live in `.claude/skills/` and apply to this repo only ([docs](https://code.claude.com/docs/en/skills)).
- **GSAP skills:** GSAP publishes [official skills](https://github.com/greensock/gsap-skills) covering ScrollTrigger, timelines, and performance.
- **Three.js skills:** a [community collection](https://github.com/cloudai-x/threejs-skills) covers scene setup, lighting, loaders, and shaders.
- **Phaser skills:** a tilemap skill is listed on skills.sh under Phaser's repository. Its contents are not yet verified.
- **add-content (to write):** a project skill that explains how to add a project, book, hobby, or note as a content file.
- **village-style (to write):** a project skill that holds the style rules: palette, tile size, fonts, and the shared exit button.

Third-party skills can include scripts, so read each one before installing it.

## Other tools

- **Tiled:** lay out the pixel house and village maps.
- **Aseprite or Piskel:** edit sprites now and draw original ones later. Piskel is free.
- **Lighthouse:** check performance and accessibility after each phase.

## Privacy and repo rules

A public GitHub repo exposes every file and its full history, so these rules apply from the first commit.

- **Personal details:** no home address, phone number, birthdate, or student ID anywhere on the site or in the repo.
- **Proprietary material:** no code, data, documents, or screenshots belonging to an employer or other organization. Describe the internship by role and lessons learned.
- **API keys:** keep stock-data and other keys out of the repo and the front-end code. Call those APIs through a small serverless function.
- **Market data:** many providers prohibit publicly redistributing real-time quotes. Use delayed or demo data on the public newsroom.
- **Contact:** the mailbox links to a contact form or a dedicated email address, not a personal one.
- **Photos:** strip metadata from photos before uploading, since phone photos often embed GPS location.
- **The house:** keep it fictional rather than modeled on a real home.
- **Course work:** check the course's rules before publishing source code from a class project.

## Open decisions

- [ ] Character pick: optional with a default pre-selected (assumed), or required before the jump?
- [ ] Music and shows: rooms in the pixel house only (assumed), or village buildings as well?
- [ ] Signpost: add a village map at the landing spot that doubles as the fast index?
- [ ] Return visits: skip the fall for visitors who have already seen it, with a replay button?
- [ ] Village style: Kenney Sketch Town, or another non-pixel style?
- [ ] Pixel house furniture: pay for Modern Interiors, or use Kenney's free indoor tiles?
- [ ] Hosting: Cloudflare Workers or GitHub Pages?
