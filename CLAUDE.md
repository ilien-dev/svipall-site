# Svipall site

Published at **svipall.ilien.dev**. Two surfaces:

- **`/`, the product page.** Hand-written, for a non-technical AI user. It is
  the only part of this site anyone edits by hand, and only when the product
  gains something big enough to show there.
- **`/docs`, Starlight.** Never written here. `scripts/sync-docs.mjs`
  generates it on every build from the product repo (ilien-dev/svipall):
  `docs/README.md` is the index (each `##` is a sidebar group, each
  `- [Title](file.md): summary` is a page, in order), page titles come from
  each file's first `# heading`, links are rewritten to site URLs or GitHub at
  the same ref, and `CHANGELOG.md` becomes "What's new". A deploy (Cloudflare Workers
  Builds, `wrangler.jsonc` serves `dist/`) or CI build reads the newest stable `vX.Y.Z` tag. Locally the
  build reads `..` (this repo as svipall's `site/` submodule) or `../svipall`.

The docs wear the product page's shell. Both surfaces render one header,
`src/components/SiteHeader.astro` (the product page swaps the design's own
header for it; `DocsHeader.astro` wraps it for Starlight), `src/styles/docs-shell.css` brings the sky, cards
and motion, and sync-docs writes the portal home and the sidebar icons
(`src/generated/sidebar.css`). Both surfaces use cross-document view
transitions, sharing `view-transition-name: site-header`.

Astro 5.18 + Starlight 0.37 (the last Starlight on Astro 5; 0.38+ needs Astro 6+).

## Rules

1. **Nothing on this site may claim something the product does not do.** A
   docs fix belongs in the product repo, never in generated files here
   (`src/content/docs/`, `src/generated/` are gitignored and rebuilt). Every
   docs page ends with the file and ref it came from.
2. **The craft floor is not licensable.** Contrast (WCAG AA *and* APCA; the
   dark theme once passed AA at 7.39:1 and failed APCA body at Lc 58.2), visible
   focus, reduced motion (every animation stops under
   `prefers-reduced-motion`), hit targets of 44px or more, measure.
3. **One theme for both surfaces.** Starlight keeps it in `<html data-theme>`
   and `localStorage['starlight-theme']` (`light`, `dark`, or empty for auto).
   The product page reads and writes that same key, so don't add a second one.
4. **A link that does not resolve fails the build.** `starlight-links-validator`
   covers the docs and `scripts/check-links.mjs` covers `dist/`. A dead
   same-page anchor in a released tag can't be fixed after the fact, so
   sync-docs unlinks it and prints it. Fix it in the product repo.
5. **Nothing on the product page appears or disappears statically.** Every
   element has an entrance and an exit: sections on scroll, and every state
   change (tabs, panels, toggles, copied labels, theme) animates out and in
   rather than swapping. Decorative SVGs loop without a fade. Only
   `prefers-reduced-motion` may make a change instant. The owner asked for
   this explicitly after a set-up tab swapped with no motion.
6. **Motion must never stutter.** Loops animate only `transform` and
   `opacity` (the sky drifted by `background-position` repainted the whole
   page each frame; a live `backdrop-filter` over it did the same). Remove a
   transform animation's class when it ends: while in effect it makes the
   element the containing block of its fixed children. Docs pages swap
   through `docs-router.ts` without a view transition, whose snapshot of a
   long page cost a 50 ms frame. Measure frames before calling it smooth.

## The product page

The markup in `src/home/orbit.body.html` and the tokens and animations in
`src/styles/orbit.css` are the approved canvas design ("Orbit"), ported by
`scripts/port-orbit.mjs`. Edit them in place, or revise the design and re-run
the port. A re-run overwrites both files, which is why what the live page adds
lives in `src/styles/page.css`. Colours are tokens keyed off
`:root[data-theme]`. SVG artwork uses the `c-*` (fill) and `s-*` (stroke)
classes so it follows the theme.

Animated SVG loops must be seamless. Move by an exact multiple of the repeated
content in px; a `%` transform on SVG resolves against the viewport, not the
element. Clip with `<clipPath>`, never `clip-path: inset()` on a `<g>`.

## Things that have broken before

- **An SVG in `<img src>` is a separate document** and cannot inherit page
  custom properties. The mark ships as two files (`svipall-mark.svg`,
  `-dark.svg`) swapped by theme.
- **A third-party mark goes in verbatim or not at all.** Use the vendor's own
  published asset, byte for byte, never an icon set's guess at it.
- **A flex item that may shrink below its content overlaps; it does not
  squash.** Render at 320px before calling a header done.
- **Astro reads `{ }` in markup as an expression.** The port refuses a body
  that contains a brace.

## Verifying

```bash
npm run verify     # sync docs, build (links validated), then check-links over dist/
SVIPALL_DOCS_FROM_TAG=1 npm run build   # build exactly what a deploy would
```

Look at the rendered page, light and dark, at 320px and at desktop width. Most
of the bugs above were found that way, not by reading CSS.
