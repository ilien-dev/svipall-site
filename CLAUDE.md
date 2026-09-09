# Svipall site

Two surfaces. A **persuade** home at `/`, and a **read** docs section at `/docs`.
Astro 5, static, vanilla CSS custom properties, Pagefind for docs search.

## Before you change anything

Read `.ptah/RULES.md`. It is the ledger: every design decision, why it was made,
who asked for it, and the ones that are recorded as **failing** rather than
quietly fixed. It is not documentation written after the fact — each entry was
written at the moment the decision was made, so a later session can tell a
decision from an oversight.

`.ptah/BRIEF.md` holds the truth ledger: what this product can and cannot be said
to do, verified 2026-09-09, and the list of things that must never appear on the
site. `.ptah/DIRECTION.md` holds the art direction, including a full record of a
direction that was built and then rejected, kept so nobody revives it.

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
npm run verify          # build, then broken-link check, then the rule check
npm run check:links     # internal links and anchors, over dist/
npm run check:rules     # the static ledger check
```

`check:rules` currently reports **24 findings, all triaged and recorded** at the
end of `RULES.md` under "The twenty-four that remain". They are heuristic false
positives — `@font-face` descriptors that cannot carry a fallback, labels the
scanner reads as running text, headings it reads as body measure, an `<img>`
written inside a comment. `disabledChecks` is empty on purpose: they are reported
every run and explained once, rather than silenced.

A **new** finding is a real finding. Do not add it to that table without doing
the work to show it is a false positive.

## Things that have broken before

Each of these was found by looking at the rendered page, not by reading the CSS.
That is the method: measure the result.

- **Astro scoped styles go to the component that owns the template.** A class
  passed as a prop to a child component carries the *child's* hash, so the
  parent's rule silently never applies. Use `:global()` when styling across that
  boundary.
- **An SVG in `<img src>` is a separate document** and cannot inherit page custom
  properties. The logo must be inlined. This was shipped wrong twice — once in
  the mark, once in the favicon.
- **A property set for one layout keeps applying in another.** `justify-content:
  center`, set for a flex column, centred a grid *track* when the same element
  switched to `display: grid`, and only showed below 900px.
- **An empty slot in a gap-seam grid is a hole**, not a blank: the container's
  background shows through as a solid block. The fix used everywhere here is two
  columns plus `:last-child:nth-child(odd) { grid-column: 1 / -1 }`.
- **`rules.json` has failed open twice.** Once with inline `(?i)` prefixes the
  checker threw on and discarded; once with `"\b"`, which in JSON is a backspace
  byte and not a word boundary. If you add a pattern, assert that it compiles
  *and* that it matches something you expect it to match.
- **WCAG AA is not the whole contrast story.** The dark theme passed AA at 7.39:1
  and failed the APCA body floor at Lc 58.2. Both are measured; both must pass.

## Where things are

| | |
|---|---|
| `src/styles/tokens.css` | The only file allowed raw values. Three layers: `--ds-*` primitive, `--color-*` alias, components use the alias. |
| `src/components/` | The home's blocks. Each carries a header comment stating what it must never do. |
| `src/content/docs/*.md` | The twelve docs pages. Front matter requires `source:`. |
| `src/layouts/Docs.astro` | The docs shell: sidebar, prose, on-this-page. |
| `.ptah/` | The ledger, the checkers, the direction. |
