import { defineConfig } from 'astro/config';
import { rehypeTableScroll } from './src/lib/rehype-table-scroll.mjs';

export default defineConfig({
  site: 'https://svipall.ilien.dev',
  build: { inlineStylesheets: 'auto' },
  markdown: {
    rehypePlugins: [rehypeTableScroll],
    shikiConfig: {
      // Two themes, swapped by the same data-theme attribute the rest of the
      // site uses, so a code block is never a light rectangle in a dark page.
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: false,
    },
  },
});
