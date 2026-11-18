# svipall-site

The website for [Svipall](https://github.com/ilien-dev/svipall), published at
[svipall.ilien.dev](https://svipall.ilien.dev). It has two parts: a product
page that makes the case for the tool in plain words, and documentation that
explains how it works.

This repository is only the site. The product and its documentation live in
[ilien-dev/svipall](https://github.com/ilien-dev/svipall).

## What's in it

- **`/`, the product page.** Written by hand, for someone who uses AI but is
  not technical. Animated diagrams show how Svipall sits between an AI app and
  the web. It has a light and a dark theme, shared with the docs.
- **`/docs`, the documentation.** Not written here. On every build,
  `scripts/sync-docs.mjs` takes `docs/` and `CHANGELOG.md` from the product
  repository and turns them into [Starlight](https://starlight.astro.build)
  pages. The sidebar, page order and titles all come from the product repo,
  so a new release updates the docs without anyone touching this repository.

Astro 5 with Starlight, fully static. Search is Pagefind, built into Starlight.

## Where the docs come from

| Where the build runs | Docs source |
|---|---|
| Cloudflare (Workers Builds or Pages) or any CI | The newest stable `vX.Y.Z` tag of ilien-dev/svipall, cloned shallow and sparse |
| Your machine, with this repo as svipall's `site/` submodule | The parent checkout (`..`) |
| Your machine, with svipall checked out beside this repo | `../svipall` |
| `SVIPALL_SRC=<dir>` | That checkout |
| `SVIPALL_DOCS_FROM_TAG=1` | The newest stable tag, as on a deploy |

In the product repo, `docs/README.md` is the index. Each `##` heading becomes
a sidebar group and each `- [Title](file.md): summary` line becomes a page, in
that order. Pages that the index does not link are not published. A release
too old to have that index uses `src/docs-index.fallback.md` instead.

When a svipall release ships, its `release.yml` calls the Cloudflare deploy
hook, and that build picks up the new tag.

## Run it

Node 22.

```bash
npm install
npm run dev        # syncs the docs, then http://localhost:4321
npm run build      # syncs the docs, builds into dist/ with the search index
npm run preview    # serve that build
npm run verify     # build, then check every internal link
```

## Two rules

1. **The site may not claim anything the product does not do.** Every docs
   page ends with the file and release it was generated from. If this site
   and the product repo disagree, the product repo is right.
2. **The accessibility floor is not negotiable.** That covers contrast, visible
   focus, reduced motion (every animation stops under
   `prefers-reduced-motion`), hit targets and line length.

## Where things are

| Path | What |
|---|---|
| `src/pages/index.astro` | The product page: its head, theme and scripts |
| `src/home/orbit.body.html` | The product page markup, ported from the approved design |
| `src/styles/orbit.css` | Its design tokens (light and dark) and animations |
| `src/styles/page.css` | What the real page adds on top of the design |
| `src/styles/starlight.css` | The docs in the brand's colours and type |
| `scripts/sync-docs.mjs` | Product repo docs into Starlight pages and the sidebar |
| `scripts/port-orbit.mjs` | Re-ports the design if it changes on the canvas |
| `scripts/check-links.mjs` | The link gate CI runs after the build |
| `src/docs-index.fallback.md` | The docs index for releases that predate `docs/README.md` |

