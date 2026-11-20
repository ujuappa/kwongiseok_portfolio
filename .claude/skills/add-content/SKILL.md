---
name: add-content
description: Adds or edits an entry in this portfolio's content collections — a project, experience entry, book, hobby, taste (music, shows, or food), or note — or changes profile.yaml (tagline, links, skills, languages). Use whenever the user wants to add, update, hide, feature, or remove something on the site, such as "add this project", "I read this book", "add my internship", "put this in the newsroom", or "add a skill". Covers file naming, frontmatter per collection, internal tags, drafts, the three-featured limit, and the privacy checks.
---

# Add content

All text on the site lives in `src/content/`. Every layer (the fall, the village, the plain index at `/map/`) reads these files, so adding an entry here is the whole job. Never copy text into a scene or page.

The schemas are in `src/content.config.ts`. If this skill and the schema disagree, the schema wins; fix this skill afterwards.

## Steps

1. **Pick the collection** from the table below.
2. **Get the facts from the user.** Use only what they said or what a source they gave you says (a resume, a repo, a post). Don't add skills, numbers, or claims to make an entry sound better. If a required field is unknown, ask, or use `draft: true` with a comment naming the placeholder.
3. **Run the privacy check** (below) before writing anything.
4. **Write one Markdown file** at `src/content/<collection>/<slug>.md`. The slug is lowercase kebab-case and becomes the entry's ID, so pick one that won't need renaming (`ai-news-digest`, not `project-3`).
5. **Verify** with `npm run build`, then check the entry on `/map/` (`npm run dev`, then http://localhost:4321/kwongiseok_portfolio/map/).
6. **Delete the `.gitkeep`** in that collection's folder once it has a real entry.

| Collection | Where it shows | Required fields beyond the base |
|---|---|---|
| `projects` | Forge (or Newsroom with the `newsroom` tag); clouds in the fall if `featured` | `summary` |
| `experience` | Plain index; the fall's parachute beat shows work, internship, and education (not service) | `org`, `kind` |
| `books` | 3D library | `author`, `status` |
| `hobbies` | Garden | none |
| `tastes` | Pixel house: music → studio, shows → theater room, food → kitchen | `category` |
| `notes` | Pixel house study (learnings and philosophies) | none |

Sections of the plain index appear only when their collection has a published entry, so the first entry in a collection also adds its section.

## Base fields (every collection)

```yaml
title: Human-readable name
date: 2026-07-28        # YYYY-MM-DD. Sorting is newest first.
tags: [ai, python]      # lowercase kebab-case; optional, defaults to []
draft: true             # optional; hides the entry everywhere
```

What `date` means depends on the collection:

- **projects:** when it was built, or started if still active.
- **experience:** the start date. For education, the graduation month (use the 1st, for example `2026-12-01`).
- **books, hobbies, tastes, notes:** when it was added or written.

If only the month is known, use the 1st. Only the month and year are shown.

## Per-collection templates

### Projects

```markdown
---
title: AI News Digest
date: 2026-07-28
tags: [newsroom, ai, python]
summary: One sentence on what it is and does. Shown on cards and clouds.
status: active          # or finished (the default). Active sits on the forge's anvil.
featured: true          # optional; see the limit below
links:
  - label: Live site
    url: https://example.com/
  - label: GitHub
    url: https://github.com/ujuappa/example
---

- What you built, in past tense, starting with a verb.
- One bullet per distinct piece of work. Don't repeat the summary as the first bullet.
```

- **Featured:** at most three projects can have `featured: true`. They are the clouds in the fall. A fourth fails the build with a message naming which to unset. Ask the user which one to drop rather than choosing. The current three are the resume projects.
- **Links:** every `url` must be a full URL. Private work has no links; leave `links` out.
- **Status:** `active` shows as "in progress" on the plain index and puts the project on the forge's anvil.

### Experience

```markdown
---
title: AI Solutions Intern     # the role, or the degree for education
org: Boncom
kind: internship               # work | internship | education | service
date: 2026-07-23
end: 2026-11-25                # omit while ongoing ("– present")
location: Salt Lake City, Utah # city or region only, never an address
tags: [internship, ai]
---

One sentence describing the role.

- What you did and learned.
```

- **Education** not finished yet: set `expected: true` and use the graduation month as `date`. It shows as "Expected Dec 2026".
- **Grouping:** `work` and `internship` show together, then education, then service.

### Books

```markdown
---
title: The Pragmatic Programmer
author: David Thomas and Andrew Hunt
status: liked            # or to-read
date: 2026-11-21
coverId: 12345678        # optional; Open Library cover ID, not the ISBN
spineColor: '#7c2d12'    # optional; CSS color for the 3D spine
tags: [programming]
---
```

- **Cover ID:** look it up with `https://openlibrary.org/search.json?title=<title>&author=<author>&fields=title,author_name,cover_i&limit=5` and use `cover_i` from the matching result. Confirm the match with the user if there are several editions. Never store or look up by ISBN; ISBN requests are rate-limited.
- **Body:** optional. If the user gives a short note on the book, put it in the body. Don't write one for them.

### Hobbies and notes

```markdown
---
title: Archery
date: 2026-11-21
summary: Optional one-line description.
tags: [outdoors]
---

Body in the user's own words.
```

Notes are learnings and philosophies, so the body is the point. Keep the user's wording; fix only typos and clarity, and ask before changing meaning.

### Tastes

```markdown
---
title: Album or show or dish name
category: music          # music | shows | food
date: 2026-11-21
summary: Optional one line on why.
embed: https://open.spotify.com/embed/album/...   # optional
tags: []
---
```

- **Embeds:** use only the provider's official embed URL (a Spotify `/embed/` URL, a YouTube `/embed/` URL). Never download or host tracks, clips, posters, or cover art in `public/`.
- **Food** usually has no embed. A photo the user took is fine once its metadata is stripped (see below).

## Profile

`src/content/profile.yaml` holds one entry with `id: main`. Edit it in place; don't add a second entry.

- **skills:** a list of `{ area, items }`, grouped by area (for example "Backend and data"), not by proficiency. Add an item to an existing area before making a new one.
- **links:** `{ label, url }` with full URLs. No personal email; the contact link must be a dedicated address or a form.
- **tagline:** one sentence, used as the site's description and link preview. Only claims the user's resume supports.

## Internal tags

Some tags place an entry in a village building instead of describing it. They're listed in `INTERNAL_TAGS` in `src/lib/content.ts` and are hidden from visitors by `publicTags()`.

- **Current internal tags:** `newsroom` (puts a project in the Newsroom instead of the Forge).
- **Adding a new one:** add it to `INTERNAL_TAGS` in the same change, or visitors will see it.
- **Showing tags in new code:** always pass them through `publicTags()`.

## Drafts

Set `draft: true` to keep an entry out of every page and the fall. Use it for:

- entries waiting on details from the user, with a comment saying what's missing;
- placeholder dates, with a comment saying the date is a placeholder.

To publish, fill in the details, replace any placeholders, and delete the `draft` line. Tell the user what's still a placeholder.

## Privacy check

The repo is public and its full history is visible, so check before writing, not after.

- **No personal details:** phone number, home address, birthdate, student ID, or personal email. `location` is a city or region only.
- **No employer material:** no code, data, documents, client names, or screenshots from Boncom or any other organization. Describe internship work by role and lessons learned. Images of internship apps must be mockups with made-up data, unless the user has the employer's written OK.
- **No API keys or tokens** anywhere, including in project bullets or links with query strings.
- **Photos:** strip metadata before adding one to `public/assets/`. For example, `exiftool -all= -overwrite_original <file>`, or re-export the image without metadata. Confirm it worked before committing.
- **Course work:** before linking a class project's source, ask whether the class allows publishing it.

If something fails the check, stop and tell the user what and why instead of writing a softened version.

## Verify

1. `npm run build`. It type-checks the content against the schemas and fails on:
   - a missing required field or a wrong enum value (the error names the file and field);
   - a malformed URL in `links` or `embed`;
   - more than three featured projects.
2. Open `/map/` in the dev server and read the new entry as a visitor would: the dates, the tags (no internal tags showing), and the links.
3. For a project or experience entry, also open `/` and use "Replay the fall" to see it in the fall.

Empty-collection warnings during the build ("No files found matching…" and "The collection … does not exist or is empty") are expected for collections that have no entries yet.
