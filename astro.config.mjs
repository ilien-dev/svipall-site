import { readFileSync, existsSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';

/*
 * Two surfaces. `/` is the product page, hand-written in src/pages/index.astro.
 * `/docs` is Starlight, and none of it is written here: scripts/sync-docs.mjs
 * pulls the product repository's docs/ (the newest stable tag on a deploy) and
 * leaves the sidebar it derived from docs/README.md in src/generated/docs.json.
 */
const GENERATED = './src/generated/docs.json';
if (!existsSync(GENERATED)) {
  throw new Error('src/generated/docs.json is missing: run `node scripts/sync-docs.mjs` first (npm run dev/build do).');
}
const docs = JSON.parse(readFileSync(GENERATED, 'utf8'));

export default defineConfig({
  site: 'https://svipall.ilien.dev',
  trailingSlash: 'ignore',
  integrations: [
    starlight({
      title: 'Svipall docs',
      description: 'Documentation for Svipall, the free, local web add-on for AI apps.',
      logo: {
        light: './src/assets/brand/svipall-mark.svg',
        dark: './src/assets/brand/svipall-mark-dark.svg',
        alt: 'Svipall',
      },
      favicon: '/favicon.svg',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/ilien-dev/svipall' }],
      customCss: ['./src/styles/starlight.css'],
      sidebar: docs.sidebar,
      lastUpdated: false,
      pagination: true,
      head: [
        { tag: 'meta', attrs: { property: 'og:image', content: 'https://svipall.ilien.dev/og.png' } },
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
      ],
      expressiveCode: { themes: ['github-dark', 'github-light'] },
      plugins: [starlightLinksValidator({ errorOnRelativeLinks: false, errorOnLocalLinks: false })],
    }),
  ],
});
