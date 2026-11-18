/*
 * sync-docs — turns the product repository's docs into this site's /docs.
 *
 * The docs are written once, in ilien-dev/svipall, as plain Markdown that
 * reads well on GitHub. Nothing about this site is allowed to leak into them:
 * no frontmatter, no site-only syntax. Everything Starlight needs is derived
 * here, at build time:
 *
 *   - WHICH pages exist and in WHAT order comes from `docs/README.md`. Each
 *     `## Heading` is a sidebar group, each `- [Title](file.md): summary` list
 *     item is a page, in list order. A file that README does not link is not
 *     published. A link to `sub/README.md` is a nested group read the same way.
 *   - The TITLE is the page's first `# heading` (removed from the body, since
 *     Starlight draws the title itself). The DESCRIPTION is the summary from
 *     the index, else the first paragraph.
 *   - LINKS are rewritten: to another published page they become a site URL,
 *     to anything else in the repo they become GitHub at the same ref.
 *
 * WHERE the docs come from:
 *   - SVIPALL_SRC=<dir>                 that checkout, as it is.
 *   - on Cloudflare Pages or any CI     the newest STABLE tag (vX.Y.Z), cloned
 *                                       sparse and shallow. This is what makes
 *                                       a release update the site by itself.
 *   - locally                           the parent repo when this site is the
 *                                       svipall `site/` submodule, else a
 *                                       sibling `../svipall`, else the tag.
 *
 * A tag older than `docs/README.md` has no index; then the one in
 * `src/docs-index.fallback.md` stands in for it.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import GithubSlugger from 'github-slugger';

const REPO = 'ilien-dev/svipall';
const GIT_URL = `https://github.com/${REPO}.git`;
const STABLE = /^v(\d+)\.(\d+)\.(\d+)$/;
const OUT = 'src/content/docs/docs';
const GENERATED = 'src/generated';
const CLONE = '.svipall-src';

function git(args, opts = {}) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], ...opts }).trim();
}

function latestStableTag() {
  const out = git(['ls-remote', '--tags', '--refs', GIT_URL]);
  const tags = out
    .split('\n')
    .map((line) => line.split('refs/tags/')[1])
    .filter((tag) => tag && STABLE.test(tag))
    .map((tag) => ({ tag, v: STABLE.exec(tag).slice(1).map(Number) }))
    .sort((a, b) => b.v[0] - a.v[0] || b.v[1] - a.v[1] || b.v[2] - a.v[2]);
  if (!tags.length) throw new Error(`no stable vX.Y.Z tag found on ${GIT_URL}`);
  return tags[0].tag;
}

function isCheckout(dir) {
  return existsSync(join(dir, 'docs', 'install.md')) && existsSync(join(dir, 'Cargo.toml'));
}

function resolveSource() {
  if (process.env.SVIPALL_SRC) {
    const dir = process.env.SVIPALL_SRC;
    if (!isCheckout(dir)) throw new Error(`SVIPALL_SRC=${dir} is not a svipall checkout`);
    return { dir, ref: 'main', version: null, origin: dir };
  }
  const remote = process.env.CF_PAGES || process.env.WORKERS_CI || process.env.CI || process.env.SVIPALL_DOCS_FROM_TAG;
  if (!remote) {
    for (const dir of ['..', '../svipall']) {
      if (isCheckout(dir)) return { dir, ref: 'main', version: null, origin: `local ${dir}` };
    }
  }
  const tag = latestStableTag();
  rmSync(CLONE, { recursive: true, force: true });
  git(['-c', 'advice.detachedHead=false', 'clone', '--quiet', '--depth', '1', '--branch', tag, '--filter=blob:none', '--sparse', GIT_URL, CLONE]);
  git(['-C', CLONE, 'sparse-checkout', 'set', 'docs']);
  return { dir: CLONE, ref: tag, version: tag, origin: `${REPO}@${tag}` };
}

/* ---------- the index ---------- */

const ITEM = /^\s*[-*]\s+\[([^\]]+)\]\(([^)\s]+)\)\s*(?:[:—–-]\s*(.*))?$/;

/** Parses an index README into { title, intro, groups: [{ label, items }] }. */
function parseIndex(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let title = null;
  const intro = [];
  const groups = [];
  let current = null;
  let fence = false;
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    if (fence) continue;
    const h1 = /^#\s+(.+?)\s*#*\s*$/.exec(line);
    const h2 = /^##\s+(.+?)\s*#*\s*$/.exec(line);
    if (h1 && !title) { title = h1[1]; continue; }
    if (h2) { current = { label: h2[1], items: [] }; groups.push(current); continue; }
    const item = ITEM.exec(line);
    if (item) {
      if (!current) { current = { label: null, items: [] }; groups.push(current); }
      current.items.push({ label: item[1].replace(/[`*_]/g, ''), href: item[2], summary: item[3]?.trim() || '' });
    } else if (!current && line.trim() && !/^<!--.*-->$/.test(line.trim())) {
      intro.push(line);
    }
  }
  return { title, intro: intro.join('\n'), groups };
}

/* ---------- pages ---------- */

/** docs-relative path → slug under /docs/. */
function slugFor(docPath) {
  const noExt = docPath.replace(/\.md$/i, '');
  if (/(^|\/)README$/i.test(noExt)) return noExt.replace(/\/?README$/i, '') || '';
  return noExt;
}

function urlFor(slug) {
  return slug ? `/docs/${slug.toLowerCase()}/` : '/docs/';
}

const IMAGE = /\.(png|jpe?g|gif|webp|svg|avif|mp4|webm)$/i;

function firstParagraph(body) {
  let fence = false;
  for (const block of body.split(/\n\s*\n/)) {
    const t = block.trim();
    if (/^(```|~~~)/.test(t)) { fence = !fence; continue; }
    if (fence || !t || /^(#|<|\||[-*+]\s|>|!\[|\d+\.\s)/.test(t)) continue;
    return plain(t);
  }
  return '';
}

function plain(md) {
  const text = md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > 200 ? `${text.slice(0, 197).replace(/\s+\S*$/, '')}…` : text;
}

function makeRewriter({ docPath, published, ref }) {
  const pageDir = posix.dirname(posix.join('docs', docPath));
  return (target, { image = false } = {}) => {
    if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#') || target.startsWith('//')) return target;
    const [pathPart, anchor] = target.split('#');
    const repoPath = target.startsWith('/')
      ? pathPart.replace(/^\/+/, '')
      : posix.normalize(posix.join(pageDir, decodeURIComponent(pathPart)));
    const hash = anchor ? `#${anchor}` : '';
    if (!image && repoPath.startsWith('docs/')) {
      const rel = repoPath.slice('docs/'.length);
      if (rel === 'README.md' || rel === '') return `/docs/${hash}`;
      const asFile = published.get(rel) ?? published.get(posix.join(rel, 'README.md'));
      if (asFile !== undefined) return urlFor(asFile) + hash;
    }
    if (!image && repoPath === 'CHANGELOG.md') return `/docs/changelog/${hash}`;
    if (image || IMAGE.test(repoPath)) return `https://raw.githubusercontent.com/${REPO}/${ref}/${repoPath}`;
    return `https://github.com/${REPO}/blob/${ref}/${repoPath}${hash}`;
  };
}

/** Rewrites Markdown links/images and HTML href/src/srcset, outside code. */
function rewriteLinks(body, rewrite) {
  const out = [];
  let fence = false;
  for (const line of body.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) { fence = !fence; out.push(line); continue; }
    if (fence) { out.push(line); continue; }
    const parts = line.split(/(`[^`]*`)/);
    out.push(parts.map((part, i) => {
      if (i % 2 === 1) return part;
      return part
        .replace(/(!?)\[([^\]]*)\]\(([^)\s]+)((?:\s+"[^"]*")?)\)/g, (_, bang, text, url, title) =>
          `${bang}[${text}](${rewrite(url, { image: bang === '!' })}${title})`)
        .replace(/\b(href|src)="([^"]+)"/g, (_, attr, url) => `${attr}="${rewrite(url, { image: attr === 'src' })}"`)
        .replace(/\bsrcset="([^"]+)"/g, (_, set) =>
          `srcset="${set.split(',').map((c) => { const [u, ...d] = c.trim().split(/\s+/); return [rewrite(u, { image: true }), ...d].join(' '); }).join(', ')}"`)
        .replace(/^\[([^\]]+)\]:\s*(\S+)/, (_, id, url) => `[${id}]: ${rewrite(url)}`);
    }).join(''));
  }
  return out.join('\n');
}

function splitTitle(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/^---\n[\s\S]*?\n---\n/, '').split('\n');
  let fence = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(```|~~~)/.test(lines[i])) fence = !fence;
    if (fence) continue;
    const m = /^#\s+(.+?)\s*#*\s*$/.exec(lines[i]);
    if (m) { lines.splice(i, 1); return { title: plain(m[1]), body: lines.join('\n').replace(/^\s+/, '') }; }
    if (lines[i].trim() && !lines[i].trim().startsWith('<')) break;
  }
  return { title: null, body: lines.join('\n') };
}

/** Markdown to plain text, whole: keeps underscores (tool names) and length. */
function unmark(md) {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cap(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function yaml(value) {
  return JSON.stringify(value);
}

/* Pages are held until every one is known, so an anchor can be checked
   against the headings of the page it points at before anything is written. */
const queue = [];

function writePage(file, page) {
  queue.push({ file, ...page });
}

/** The anchors a page's headings produce, the way GitHub and Starlight both slug them. */
function anchorsOf(body) {
  const slugger = new GithubSlugger();
  const set = new Set();
  let fence = false;
  for (const line of body.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    if (fence) continue;
    const m = /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(line);
    if (m) set.add(slugger.slug(plain(m[1]).replace(/…$/, '')));
    for (const id of line.matchAll(/\bid="([^"]+)"/g)) set.add(id[1]);
  }
  return set;
}

/*
 * A link to a heading that does not exist is a bug in the source doc, and the
 * links validator would (rightly) fail the build on it. A tag cannot be fixed
 * after the fact, so the dead anchor is dropped — a same-page link becomes its
 * text, a cross-page one points at the page — and every one is reported.
 */
function flush() {
  const byUrl = new Map(queue.map((p) => [urlOf(p.file), anchorsOf(p.body)]));
  const dropped = [];
  for (const page of queue) {
    const own = byUrl.get(urlOf(page.file));
    page.body = page.body
      .replace(/\[([^\]]*)\]\(#([^)\s]+)\)/g, (all, text, hash) => {
        if (own.has(decodeURIComponent(hash))) return all;
        dropped.push(`${page.file}#${hash}`);
        return text;
      })
      .replace(/\]\((\/docs\/[^)#\s]*)#([^)\s]+)\)/g, (all, url, hash) => {
        const target = byUrl.get(url);
        if (!target || target.has(decodeURIComponent(hash))) return all;
        dropped.push(`${page.file} → ${url}#${hash}`);
        return `](${url})`;
      });
    mkdirSync(dirname(page.file), { recursive: true });
    const fm = ['---', `title: ${yaml(page.title)}`];
    if (page.description) fm.push(`description: ${yaml(page.description)}`);
    if (page.editUrl) fm.push(`editUrl: ${yaml(page.editUrl)}`);
    if (page.extraFm) fm.push(...page.extraFm);
    fm.push('---', '');
    writeFileSync(page.file, fm.join('\n') + page.body.trimEnd() + (page.sourceNote ? `\n\n---\n\n<small>${page.sourceNote}</small>\n` : '\n'));
  }
  if (dropped.length) {
    console.warn(`sync-docs: ${dropped.length} link(s) to a heading that does not exist, unlinked (fix them in the product repo):`);
    for (const d of dropped) console.warn(`  ${d}`);
  }
}

function urlOf(file) {
  const rel = file.slice(OUT.length + 1).replace(/\\/g, '/').replace(/\.md$/, '');
  return rel === 'index' ? '/docs/' : `/docs/${rel}/`;
}


/* ---------- icons, per sidebar group ---------- */

const ICONS = {
  overview: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  "what's new": '<path d="M12 3l1.9 4.8L19 9l-4 3.4L16.2 18 12 15.2 7.8 18 9 12.4 5 9l5.1-1.2z"/>',
  'start here': '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2z"/>',
  'using it': '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
  evidence: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
  internals: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>',
  reference: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/>',
};
const DEFAULT_ICON = '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>';
const iconPaths = (label) => ICONS[String(label).toLowerCase()] || DEFAULT_ICON;
function iconSvg(label) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconPaths(label)}</svg>`;
}
function iconMask(label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconPaths(label)}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/* ---------- main ---------- */

const src = resolveSource();
const docsDir = join(src.dir, 'docs');
const ownIndex = join(docsDir, 'README.md');
const indexText = existsSync(ownIndex)
  ? readFileSync(ownIndex, 'utf8')
  : readFileSync('src/docs-index.fallback.md', 'utf8');
const indexFromRepo = existsSync(ownIndex);

/* Walk the index (and nested README indexes) into a page list + sidebar. */
const published = new Map(); // docs-relative file → slug
const pages = []; // { file, summary, label }

function collect(index, baseDir) {
  const sidebar = [];
  for (const group of index.groups) {
    const items = [];
    for (const item of group.items) {
      if (/^[a-z]+:/i.test(item.href) || item.href.startsWith('#')) continue;
      const rel = posix.normalize(posix.join(baseDir, item.href.split('#')[0]));
      if (!existsSync(join(docsDir, rel))) {
        console.warn(`sync-docs: index links ${rel}, which this ref does not have; skipped`);
        continue;
      }
      const slug = slugFor(rel);
      published.set(rel, slug);
      pages.push({ file: rel, summary: item.summary, label: item.label });
      if (/(^|\/)README\.md$/i.test(rel)) {
        const nested = parseIndex(readFileSync(join(docsDir, rel), 'utf8'));
        items.push({
          label: item.label,
          collapsed: false,
          items: [{ label: 'Overview', slug: `docs/${slug.toLowerCase()}` }, ...collect(nested, posix.dirname(rel)).flatMap((g) => g.items ? (g.label ? [g] : g.items) : [g])],
        });
      } else {
        items.push({ label: item.label, slug: `docs/${slug.toLowerCase()}` });
      }
    }
    if (items.length) sidebar.push(group.label ? { label: group.label, items } : { items });
  }
  return sidebar;
}

const index = parseIndex(indexText);
const groups = collect(index, '');

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const sourceLabel = src.version ? `${src.version}` : 'the working tree';
const blobBase = `https://github.com/${REPO}/blob/${src.ref}`;
const editBase = `https://github.com/${REPO}/edit/main`;

for (const page of pages) {
  const raw = readFileSync(join(docsDir, page.file), 'utf8');
  const { title, body } = splitTitle(raw);
  const rewrite = makeRewriter({ docPath: page.file, published, ref: src.ref });
  const slug = published.get(page.file);
  writePage(join(OUT, slug ? `${slug}.md` : 'index.md'), {
    title: title || page.label,
    description: cap(page.summary || firstParagraph(body)),
    body: rewriteLinks(body, rewrite),
    editUrl: `${editBase}/docs/${page.file}`,
    sourceNote: `Written from <a href="${blobBase}/docs/${page.file}"><code>docs/${page.file}</code></a> at ${sourceLabel}.`,
  });
}

/* The docs home: a portal, not a list. Its cards are the index's groups,
   each with its icon and first pages; the banner is the newest changelog
   entry. Written as HTML inside the Markdown so Starlight renders it as is. */
{
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const urlOfSlug = (slug) => `/${slug}/`;
  const flat = (items) => items.flatMap((i) => (i.items ? flat(i.items) : [i]));
  const cards = groups
    .filter((g) => g.label)
    .map((g) => {
      const pages = flat(g.items).filter((i) => i.label !== 'Overview');
      const shown = pages.slice(0, 4);
      const more = pages.length - shown.length;
      return `<section class="dh-card"><span class="dh-card-ico">${iconSvg(g.label)}</span><h2>${esc(g.label)}</h2><ul>${shown
        .map((p) => `<li><a href="${urlOfSlug(p.slug)}">${esc(p.label)}</a></li>`)
        .join('')}${more > 0 ? `<li><a class="dh-more" href="${urlOfSlug(pages[shown.length].slug)}">+ ${more} more</a></li>` : ''}</ul></section>`;
    })
    .join('');
  let banner = '';
  const changelog = join(src.dir, 'CHANGELOG.md');
  if (existsSync(changelog)) {
    const text = readFileSync(changelog, 'utf8').replace(/\r\n/g, '\n');
    const m = /^##\s+([^\n]+)\n+([\s\S]*?)(?:\n\n|$)/m.exec(text);
    if (m) {
      const version = m[1].split(/\s+[—–-]\s+/)[0].trim();
      const first = unmark(m[2]).split(/(?<=\.)\s/)[0];
      banner = `<a class="dh-banner" href="/docs/changelog/"><span class="dh-badge">New in ${esc(version)}</span><span class="dh-banner-text">${esc(first)}</span><span class="dh-banner-go">What’s new →</span></a>`;
    }
  }
  const introFull = unmark(index.intro);
  const intro = introFull || 'How to install Svipall, how each part works, and the evidence behind every number.';
  const body = [
    `<div class="dh-home">`,
    `<button type="button" class="dh-search" data-open-search><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M21 21l-4.3-4.3"></path></svg><span>Search the docs</span><kbd>Ctrl K</kbd></button>`,
    banner,
    `<div class="dh-cards">${cards}<section class="dh-card dh-card-ask"><h2>Not sure where to start?</h2><p>Ask your AI: “Read the Svipall docs and tell me how to …”. It can read them with Svipall itself.</p></section></div>`,
    `</div>`,
  ].join('\n');
  writePage(join(OUT, 'index.md'), {
    title: index.title || 'Documentation',
    description: intro,
    body,
    editUrl: false,
    extraFm: ['template: splash', 'hero:', `  title: ${yaml('Documentation')}`, `  tagline: ${yaml(intro)}`],
  });
}

/* What's new: the changelog, as the repository carries it. */
{
  const changelog = join(src.dir, 'CHANGELOG.md');
  if (existsSync(changelog)) {
    const rewrite = makeRewriter({ docPath: '../CHANGELOG.md', published, ref: src.ref });
    const { body } = splitTitle(readFileSync(changelog, 'utf8'));
    writePage(join(OUT, 'changelog.md'), {
      title: "What's new",
      description: 'Every release of Svipall, newest first.',
      body: rewriteLinks(body, rewrite),
      editUrl: false,
    });
  }
}

flush();

const sidebar = [
  { label: 'Overview', slug: 'docs' },
  ...(existsSync(join(OUT, 'changelog.md')) ? [{ label: "What's new", slug: 'docs/changelog' }] : []),
  ...groups,
];

mkdirSync(GENERATED, { recursive: true });
writeFileSync(join(GENERATED, 'docs.json'), JSON.stringify({ sidebar, ref: src.ref, version: src.version }, null, 2));
/* The sidebar's top level gets one icon per entry, matched by position:
   Starlight gives a group no hook of its own, but the order is ours. */
{
  const rules = sidebar.map((entry, i) => {
    const sel = `.sidebar-content ul.top-level > li:nth-child(${i + 1})`;
    const target = entry.items ? `${sel} > details > summary .group-label` : `${sel} > a`;
    return `${target}::before{-webkit-mask-image:${iconMask(entry.label)};mask-image:${iconMask(entry.label)}}`;
  });
  writeFileSync(join(GENERATED, 'sidebar.css'), '/* Generated by scripts/sync-docs.mjs. */\n' + rules.join('\n') + '\n');
}
console.log(`sync-docs: ${pages.length} pages from ${src.origin}${indexFromRepo ? '' : ' (fallback index)'}`);
