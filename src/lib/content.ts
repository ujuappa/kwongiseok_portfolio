// Shared content queries. Every layer (plain pages and scenes) should read
// collections through these helpers so sorting and rules stay in one place.
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

type MarkdownCollection = 'projects' | 'experience' | 'books' | 'hobbies' | 'tastes' | 'notes';

export const MAX_FEATURED = 3;

/** Published entries of a collection, newest first. */
export async function getPublished<C extends MarkdownCollection>(
  name: C,
): Promise<CollectionEntry<C>[]> {
  const entries = (await getCollection(name, ({ data }) => !data.draft)) as CollectionEntry<C>[];
  return entries.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** Projects shown as clouds in the fall. Fails the build if more than three are featured. */
export async function getFeaturedProjects() {
  const featured = (await getPublished('projects')).filter((p) => p.data.featured);
  if (featured.length > MAX_FEATURED) {
    throw new Error(
      `${featured.length} projects are featured; the fall shows at most ${MAX_FEATURED}. ` +
        `Unset \`featured\` on: ${featured.slice(MAX_FEATURED).map((p) => p.id).join(', ')}`,
    );
  }
  return featured;
}

export async function getProfile() {
  const profile = await getEntry('profile', 'main');
  if (!profile) throw new Error('src/content/profile.yaml needs an entry with `id: main`.');
  return profile.data;
}

const monthYear = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });

export const formatMonth = (d: Date) => monthYear.format(d);

/** "Jun 2024 – Dec 2025", "Jun 2024 – present", or "Expected Dec 2026". */
export function formatPeriod(data: CollectionEntry<'experience'>['data']) {
  if (data.expected) return `Expected ${formatMonth(data.date)}`;
  if (data.kind === 'education' && !data.end) return formatMonth(data.date);
  return `${formatMonth(data.date)} – ${data.end ? formatMonth(data.end) : 'present'}`;
}

/** Prefix a site path with the configured base (the site is served from a subpath on GitHub Pages). */
export function url(path: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}
