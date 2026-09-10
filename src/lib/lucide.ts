/*
 * lucide — the icon set, read off disk at build time and inlined.
 *
 * Inlined rather than referenced, for the reason this project has already
 * been bitten by twice: an SVG in <img src> is a separate document and cannot
 * see the page's custom properties or currentColor. Everything here ends up
 * as markup inside the page.
 *
 * Read from node_modules rather than vendored into src/assets, so `npm
 * update lucide-static` is the whole upgrade path and nothing here can drift
 * from the version in package-lock.json.
 *
 * The lucide file's own presentation attributes (width, height, stroke-width,
 * stroke-linecap, stroke-linejoin) live on its <svg> root, which this throws
 * away. The wrapper element supplies its own, so the icons are drawn with
 * THIS site's line - 1px, square, mitred - and not with lucide's 2px round.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.resolve('node_modules/lucide-static/icons');

/* One read per distinct icon per build, not one per call site: `enter`
   renders once in the sidebar of every docs page. */
const cache = new Map<string, string>();

export function lucideBody(slug: string): string {
  const hit = cache.get(slug);
  if (hit !== undefined) return hit;

  const file = path.join(DIR, `${slug}.svg`);
  if (!fs.existsSync(file)) {
    /* Loud, at build time. A missing icon that rendered as an empty box would
       ship a hole beside a heading and nothing would say so. */
    throw new Error(`lucide: no icon named "${slug}" in ${DIR}`);
  }

  const body = fs
    .readFileSync(file, 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>[\s\S]*$/, '')
    .trim();

  if (!body) throw new Error(`lucide: "${slug}" parsed to an empty body`);

  cache.set(slug, body);
  return body;
}
