// Content collections: the single source of truth for every layer of the site
// (plain pages, the fall, the village, the pixel house, the library).
// Scenes read these collections; they never hold their own copy of the text.
import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Every Markdown entry has a title, date, and tags (docs/PLAN.md → Architecture).
const base = {
  title: z.string(),
  date: z.coerce.date(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
};

const link = z.object({ label: z.string(), url: z.url() });

const md = (dir: string) => glob({ pattern: '**/*.md', base: `./src/content/${dir}` });

const projects = defineCollection({
  loader: md('projects'),
  schema: z.object({
    ...base,
    summary: z.string(),
    links: z.array(link).default([]),
    // Shown as clouds in the fall. At most three; enforced in src/lib/content.ts.
    featured: z.boolean().default(false),
    // Forge: finished pieces hang on the wall, the active one sits on the anvil.
    status: z.enum(['finished', 'active']).default('finished'),
  }),
});

const experience = defineCollection({
  loader: md('experience'),
  schema: z.object({
    ...base,
    // `title` is the role or degree; `date` is the start (or graduation for education).
    org: z.string(),
    kind: z.enum(['work', 'internship', 'education', 'service']),
    end: z.coerce.date().optional(), // omitted = ongoing
    expected: z.boolean().default(false), // education not yet completed
    location: z.string().optional(), // city or region only, never an address
  }),
});

const books = defineCollection({
  loader: md('books'),
  schema: z.object({
    ...base,
    author: z.string(),
    status: z.enum(['liked', 'to-read']),
    // Open Library cover ID (not ISBN) to stay clear of the ISBN rate limit.
    coverId: z.number().int().optional(),
    spineColor: z.string().optional(), // CSS color for the generated 3D spine
  }),
});

const hobbies = defineCollection({
  loader: md('hobbies'),
  schema: z.object({ ...base, summary: z.string().optional() }),
});

const tastes = defineCollection({
  loader: md('tastes'),
  schema: z.object({
    ...base,
    // music → studio, shows → theater room, food → kitchen (pixel house).
    category: z.enum(['music', 'shows', 'food']),
    summary: z.string().optional(),
    embed: z.url().optional(), // official embed only; never host tracks or art
  }),
});

const notes = defineCollection({
  loader: md('notes'),
  schema: z.object({ ...base, summary: z.string().optional() }),
});

// Site-wide facts: name, tagline, skills, links. One YAML file, one entry (`id: main`).
const profile = defineCollection({
  loader: file('./src/content/profile.yaml'),
  schema: z.object({
    name: z.string(),
    tagline: z.string(),
    links: z.array(link).default([]),
    skills: z.array(z.object({ level: z.string(), items: z.array(z.string()) })).default([]),
    languages: z.array(z.string()).default([]),
  }),
});

export const collections = { projects, experience, books, hobbies, tastes, notes, profile };
