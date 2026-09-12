# Svipall site

Two surfaces. A **persuade** home at `/`, and a **read** docs section at `/docs`.
Astro 5, static, vanilla CSS custom properties, Pagefind for docs search.

## Before you change anything

This project used to carry a design ledger under `.ptah/` - the brief, the art
direction, and every design decision with the reason it was made. That tooling
has been removed. The decisions it recorded are no longer written down anywhere
in this repository, so treat the shipped code as the only statement of them, and
do not assume a pattern was deliberate because it is consistent.

The two rules below survived the removal because they are about what this site
may claim, not about how it looks.

## The two rules that are not yours or mine to waive

1. **Nothing on this site may claim something the product does not do.** Every
   number resolves to a row of the truth ledger. Every docs page names the file
   in the product repo it was written from. When this site and that file
   disagree, the file is right.
2. **The craft floor is not licensable.** Contrast, focus, reduced motion, hit
   targets, measure. One floor item is currently *failing by the author's
   explicit direction* (`R-B1-15`, the client strip has no way to stop its
   motion). It is reported as failing on every run rather than reworded to look
   clean. Do not "fix" the ledger by softening that entry.

## Verifying

```bash
npm run verify          # build, links, mark geometry, then the rule check
npm run check:links     # internal links and anchors, over dist/
npm run check:glyphs    # the mark geometry: 1px, orthogonals and exact 45s
```

`check:glyphs` reports **26 marks** and is a hard gate: the table is
mechanical, so there is nothing to triage. It asserts every slug in `ICONS` is
an icon `lucide-static` actually ships and that the `GlyphName` union and the
table agree — the two ways a mark can now reach the page as an empty box.

It used to check geometry, because the marks were drawn by hand in a 16-unit
box, 1px, orthogonals and exact 45s. They come from **lucide** now (ISC, read
off `node_modules` at build time by `src/lib/lucide.ts` and inlined). What is
still this project's is the LINE and the COLOUR: `Glyph.astro` strips lucide's
2px round stroke and redraws with `--glyph-stroke` (1.5) + `vector-effect:
non-scaling-stroke` in `--color-mark`, square caps, mitred joins. Change that
and the set stops belonging here.

`--color-mark` is **not** `--color-accent` and the two are not interchangeable.
The accent is a fill and is measured on the navy it is filled with; as a
hairline on the light cell it is 1.69:1, so painting marks with it would make
them harder to see, not easier. `--color-mark` is the same amber family
measured where a stroke actually sits: **#CC5500 light** (4.01:1 on the cell,
3.33:1 on the ground) and **#FFB03A dark** (8.54:1), the accent itself.

**Both values are chosen for chroma, and that correction cost a round.** The
first pair was #A85F00 / #FFC260, picked to match the ink's presence exactly —
Lc 68.4 against the ink's 68.8. It measured beautifully and the marks were
still lost in the copy, because matching the ink's lightness is most of what
makes two things read as the same kind of object, and at that value the amber
is a brown. The pair that works is 77–80% saturated against an ink of 8–13%,
and only has to CLEAR the 3:1 non-text floor rather than match anything.
Contrast is a floor here, not a target.

The static ledger check is gone with the rest of the tooling. Source files still
carry `ptah-allow` comments on sixteen lines; nothing reads them now, and they
are safe to delete whenever those lines are next touched.

## Things that have broken before

Each of these was found by looking at the rendered page, not by reading the CSS.
That is the method: measure the result.

- **Astro scoped styles go to the component that owns the template.** A class
  passed as a prop to a child component carries the *child's* hash, so the
  parent's rule silently never applies. `:global()` reaches the element — **and
  still loses**, because the child's own scoped selector carries an extra
  attribute selector and outranks it. Anything a parent needs to change about a
  child is a **prop**, not a rule written next door. Both halves of this cost a
  round in extend mode: the marks shipped at 16px while a rule that could never
  apply said 24.
- **An SVG in `<img src>` is a separate document** and cannot inherit page custom
  properties. The logo must be inlined. This was shipped wrong twice — once in
  the mark, once in the favicon.
- **A property set for one layout keeps applying in another.** `justify-content:
  center`, set for a flex column, centred a grid *track* when the same element
  switched to `display: grid`, and only showed below 900px.
- **An empty slot in a gap-seam grid is a hole**, not a blank: the container's
  background shows through as a solid block. The fix used everywhere here is two
  columns plus `:last-child:nth-child(odd) { grid-column: 1 / -1 }`.
- **A flex item that may shrink below its content overlaps; it does not
  squash.** The nav rail was given a third object — the version tag — and at
  320px it was drawn on top of the Docs link rather than pushing the row
  wider, because the wrapper carried `min-width: 0`. Nothing in the rail
  shrinks now: what gives way is the Docs label, hidden from sight only and
  still in the accessibility tree, and below 360px the tag itself. Found by
  rendering at 320, not by reading the CSS.
- **`rules.json` has failed open twice.** Once with inline `(?i)` prefixes the
  checker threw on and discarded; once with `"\b"`, which in JSON is a backspace
  byte and not a word boundary. If you add a pattern, assert that it compiles
  *and* that it matches something you expect it to match.
- **Two icon libraries agreeing is not the same as the vendor agreeing.** The
  Claude Code plugin tab has now been wrong twice. First it carried Simple
  Icons' `claude` — the bare sunburst, whose twenty tapered rays go sub-pixel
  at the 14px the tab draws it at, so it rendered as an orange smudge. Then it
  carried `claudecode`, the blocky mark that BOTH Simple Icons and Devicons
  ship under that name — and that is still not the icon Anthropic publishes
  for the tool. The one Anthropic ships (its own VS Code extension icon) is
  the sunburst on a `#D97757` ground. It shipped bare for a while, ground
  removed, by the author's explicit direction, and the cost of that was
  written down here rather than hidden: the bare sunburst has no mass of its
  own, its rays go sub-pixel below about 20px, and the only lever left was
  size. **That direction is lifted.** The tab now draws
  `src/assets/clients/claudecode-tile.svg` — the vendor's rounded tile with
  the mark knocked out of it — and the belt in `Clients.astro` keeps the bare
  `claudecode.svg`, because there it is 30px, in ink, in a row of other bare
  silhouettes. Two files, two jobs; neither is a variant of the other.
  When a mark identifies someone else's product, go to that product's own
  published asset, not to an icon set's guess at it.
- **A third-party mark goes in verbatim or not at all.** The knockout is a
  `<mask>`, not one merged path with `fill-rule="evenodd"`, and both halves of
  that were found by rendering it, not by reading it. evenodd inverts the
  sunburst wherever it overlaps itself, which ate a wedge out of the tile. And
  the mark's `d` opens with a *relative* moveto whose implicit linetos are
  relative too: appending it to another path displaces it, and upcasing the
  `m` to correct that turns every one of those linetos absolute and destroys
  the shape. In a path of its own the leading `m` is absolute by the spec, so
  it goes in byte for byte.
- **A blanket `fill: none` reaches inside a `<mask>` and empties it.** The tab
  glyph rule in `InstallBlock.astro` was `.install__tabicon :global(*)`, which
  hit the brand mark's `<path>` too: `fill` written on the `<svg>` never
  reached it, so twenty tapered rays were being *stroked* at 1.4px in coral,
  which is most of why that mark read as a smudge. The rule is scoped with
  `:not(.install__tabicon--brand)` now. A rule written for one mark in a set
  applies to every mark in the set until it is told not to.
- **WCAG AA is not the whole contrast story.** The dark theme passed AA at 7.39:1
  and failed the APCA body floor at Lc 58.2. Both are measured; both must pass.

## Where things are

| | |
|---|---|
| `src/styles/tokens.css` | The only file allowed raw values. Three layers: `--ds-*` primitive, `--color-*` alias, components use the alias. |
| `src/components/` | The home's blocks. Each carries a header comment stating what it must never do. |
| `src/lib/release.ts` | The product's newest **stable** release, read from the GitHub API at build time and baked into the page. Its other half is the script at the bottom of `Base.astro`, which asks again in the browser and raises the number if a release has appeared since the build. Neither half may invent one: no answer means the tag is not drawn. The `vX.Y.Z` shape test is what keeps `-rc` and `-beta` out, and it is written in both halves. |
| `src/lib/glyphs.ts` | `GlyphName` → lucide slug. The site's names on the left, lucide's on the right, so re-picking an icon is one line here and nothing else. |
| `src/lib/lucide.ts` | Reads a lucide SVG off `node_modules` at build and returns its body. Inlined, never `<img src>`. |
| `src/content/docs/*.md` | The twelve docs pages. Front matter requires `source:`. |
| `src/layouts/Docs.astro` | The docs shell: sidebar, prose, on-this-page. |
| `scripts/` | `check-glyphs.mjs` and `check-links.mjs`, the two gates in CI. |
