/*
 * Fails the build when an internal link points at a page that does not exist.
 *
 * This exists because the home shipped for a while linking to /docs, /docs/proof,
 * /docs/privacy and /docs/limits before any of them was built. Nothing caught it:
 * a static build has no reason to object to an href, and the four dead links were
 * only found by reading the page and remembering what had not been written yet.
 *
 * Anchors are checked too. A link to #a-heading-that-was-renamed is the same
 * failure with a quieter symptom.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const DIST = 'dist';

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else if (entry.name.endsWith('.html')) out.push(path);
  }
  return out;
}

const files = await walk(DIST);

// Every route the build produced, as the URL a browser would ask for.
const routes = new Set(
  files.map((f) => {
    const rel = relative(DIST, f).replaceAll('\\', '/');
    return '/' + rel.replace(/index\.html$/, '').replace(/\.html$/, '');
  })
);

// Every id and name a page defines, so an anchor can be checked against it.
const anchors = new Map();
const pages = new Map();
for (const file of files) {
  const html = await readFile(file, 'utf8');
  const rel = relative(DIST, file).replaceAll('\\', '/');
  const route = '/' + rel.replace(/index\.html$/, '').replace(/\.html$/, '');
  pages.set(route, html);
  anchors.set(
    route,
    new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))
  );
}

const problems = [];

for (const [route, html] of pages) {
  for (const match of html.matchAll(/\shref="([^"]+)"/g)) {
    const href = match[1];
    if (!href.startsWith('/')) continue;      // external, mailto, or a bare #
    const [path, hash] = href.split('#');

    const target = path.endsWith('/') || path === '' ? path : path + '/';
    const normalised = target === '' ? route : target;

    // Assets are files on disk, not routes; only check page links.
    if (/\.[a-z0-9]+$/i.test(path)) continue;

    if (!routes.has(normalised) && !routes.has(path)) {
      problems.push(`${route} -> ${href}  (no such page)`);
      continue;
    }

    if (hash) {
      const known = anchors.get(normalised) ?? anchors.get(path);
      if (known && !known.has(hash)) {
        problems.push(`${route} -> ${href}  (no such anchor)`);
      }
    }
  }
}

if (problems.length > 0) {
  console.error(`\nBroken internal links (${problems.length}):\n`);
  for (const p of problems) console.error('  ' + p);
  console.error('');
  process.exit(1);
}

console.log(`links: ${routes.size} routes, no broken internal links`);
