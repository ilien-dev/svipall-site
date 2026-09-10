/*
 * check-glyphs — the mark table, asserted rather than asserted-in-a-comment.
 *
 * The marks used to be hand-drawn and this checked their geometry: 1px,
 * orthogonals and exact 45s, half-pixel grid. They come from lucide now, so
 * that geometry is lucide's problem and this checks the thing that is still
 * ours - THE TABLE.
 *
 * Two failures it exists to catch, both silent otherwise:
 *
 *  1. A slug that lucide does not ship. `bar-chart-3` was a real icon and is
 *     not one any more; `chart-column` is. A typo or a renamed icon would
 *     reach the page as an empty box beside a heading and nothing would say
 *     so. Glyph.astro throws at build for this too - this catches it before
 *     the build, which is the cheaper half of the same gate.
 *  2. A name declared in GlyphName and never mapped, or mapped and never
 *     declared. That is the same assertion the old check made and the reason
 *     it is kept: a union member with no icon is a page that fails to render.
 *
 * This is the project's own lesson about rules.json, applied one level up: a
 * table is not a rule until something asserts it MATCHES what you expect it
 * to match.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';

const SRC = new URL('../src/lib/glyphs.ts', import.meta.url);
const ICON_DIR = new URL('../node_modules/lucide-static/icons/', import.meta.url);

const src = readFileSync(SRC, 'utf8');

if (!existsSync(ICON_DIR)) {
  console.error('glyphs: lucide-static is not installed — run npm ci first.');
  process.exit(1);
}

/* Only the body of the ICONS table, so a slug named in a comment above it
   cannot be mistaken for an entry. */
const table = src.match(/export const ICONS:[^=]*=\s*\{([\s\S]*?)\n\};/);
if (!table) {
  console.error('glyphs: the ICONS table did not parse.');
  process.exit(1);
}

const entries = [...table[1].matchAll(/^\s{2}'?([A-Za-z]+)'?:\s*'([a-z0-9-]+)',$/gm)].map(
  ([, name, slug]) => ({ name, slug }),
);

if (entries.length === 0) {
  console.error('glyphs: no marks found — the ICONS table did not parse.');
  process.exit(1);
}

const declared = [...src.matchAll(/^\s{2}\|\s*'([a-z]+)';?$/gm)].map((m) => m[1]);
if (declared.length === 0) {
  console.error('glyphs: the GlyphName union did not parse — this check would pass vacuously.');
  process.exit(1);
}

const findings = [];

for (const { name, slug } of entries) {
  if (!existsSync(new URL(`${slug}.svg`, ICON_DIR)))
    findings.push(`${name}: lucide ships no icon named "${slug}"`);
}

const mapped = entries.map((e) => e.name);
for (const n of declared) if (!mapped.includes(n)) findings.push(`${n}: declared in GlyphName and never mapped to an icon`);
for (const n of mapped) if (!declared.includes(n)) findings.push(`${n}: mapped to an icon and not declared in GlyphName`);

/* The other half of the lesson: prove the check can see the icon set at all.
   A wrong ICON_DIR would make every existsSync above return false, which
   fails loudly - but an empty directory that exists would pass one day if the
   loop were ever inverted. Assert the set is there. */
const shipped = readdirSync(ICON_DIR).filter((f) => f.endsWith('.svg')).length;
if (shipped < 100) findings.push(`lucide-static ships ${shipped} icons — that is not a complete install`);

if (findings.length) {
  console.error(`glyphs: ${findings.length} finding(s)`);
  for (const f of findings) console.error(`  ${f}`);
  process.exit(1);
}

console.log(
  `glyphs: ${entries.length} marks, all mapped to icons lucide-static ships (${shipped} available), and the GlyphName union and the ICONS table agree`,
);
