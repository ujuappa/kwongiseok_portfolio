// @ts-check
import { defineConfig } from 'astro/config';

// Hosted on GitHub Pages as a project site: https://ujuappa.github.io/kwongiseok_portfolio/
// If the site moves to a custom domain or Cloudflare, change `site` and drop `base`.
// Internal links must go through `url()` in src/lib/content.ts so they respect `base`.
export default defineConfig({
  site: 'https://ujuappa.github.io',
  base: '/kwongiseok_portfolio',
});
