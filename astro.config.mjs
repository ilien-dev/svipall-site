import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
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
/* `npm run build` syncs first; a bare `astro build` (or a host's own build step)
   gets the same sync here rather than a missing sidebar. */
if (!existsSync(GENERATED) || !existsSync('./src/generated/sidebar.css')) {
  execFileSync(process.execPath, ['scripts/sync-docs.mjs'], { stdio: 'inherit' });
}
const docs = JSON.parse(readFileSync(GENERATED, 'utf8'));

export default defineConfig({
  site: 'https://svipall.ilien.dev',
  trailingSlash: 'ignore',
  /* Pages load on hover, so a click lands on a page that is already here. */
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
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
      customCss: ['./src/styles/starlight.css', './src/styles/docs-shell.css', './src/generated/sidebar.css'],
      components: { Header: './src/components/DocsHeader.astro' },
      sidebar: docs.sidebar,
      lastUpdated: false,
      pagination: true,
      head: [
        /* A same-site navigation that arrives through a view transition does not
           replay the header's entrance: the header is already on screen. */
        { tag: 'script', content: "try{document.documentElement.style.setProperty('--sky-delay',-(Date.now()%50000)+'ms')}catch(e){}try{if(sessionStorage.getItem('svt')){document.documentElement.classList.add('vt');sessionStorage.removeItem('svt')}}catch(e){}addEventListener('pageswap',function(e){if(e.viewTransition){try{sessionStorage.setItem('svt','1')}catch(_){}}})" },
        { tag: 'meta', attrs: { property: 'og:image', content: 'https://svipall.ilien.dev/og.png' } },
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
      ],
      expressiveCode: { themes: ['github-dark', 'github-light'] },
      plugins: [starlightLinksValidator({ errorOnRelativeLinks: false, errorOnLocalLinks: false })],
    }),
  ],
});
