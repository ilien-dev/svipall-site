# Digest

What a session needs to know before touching this site, in one page. The long
form is `RULES.md`, `BRIEF.md` and `DIRECTION.md`; this is the index into them.

Written at gate 9, 2026-09-09.

## What it is

A two-surface static site for Svipall, a local Rust MCP server, CLI and REST API
for reading web pages that refuse to be read.

- `/` — **persuade**. Eight numbered bands. Written for someone who uses AI
  agents heavily and is not technical. Sections 1–6 carry no jargon at all; that
  is enforced, not aspirational.
- `/docs` — **read**. Twelve pages plus an index. Technical register, compact
  density, every page attributed to a file in the product repo.

## The constraints that produced the design

| From | What it forced |
|---|---|
| "We cannot lie at any point, and we cannot make this tool look like something it does not do." | The truth ledger in `BRIEF.md`, the forbidden list, `source:` on every docs page, and the numbers that came out badly being published beside the ones that did not. |
| "Avoid paper colours, and avoid colours you would pick from the logo's mythology." | Killed cream and killed the Norse-cliché palette. The ground is the logo's navy diluted — the same family in both themes, not a light page that happens to share an accent. |
| A bright accent with strong contrast in **both** themes. | Proved numerically that no yellow bright enough to be worth having clears 4.5:1 as ink on a light ground. That produced the **fill-only** accent system: the accent is a fill or a `<mark>`, never text, never a border. The constraint produced a better system than a free choice would have. |
| HydraDB as the reference. | The **cell grid** idiom: full-bleed bands, a centred rail with visible 1px vertical rules, radius 0, no shadow except the one overlay. |

## The five things most likely to trip you

1. Scoped styles belong to the component that owns the template, not the one that
   passes the class.
2. An SVG in `<img>` cannot inherit custom properties. Inline the mark.
3. A gap-seam grid with an empty slot shows a solid block, not a blank.
4. `rules.json` has failed open twice. Assert new patterns compile *and* match.
5. WCAG AA and APCA disagree on light-text-on-dark. Both are gates here.

## State at gate 9

| Gate | State |
|---|---|
| 1–5 interview, direction, copy, build | done |
| 6 visual loop | narrow widths measured and recorded (`R-G6-01..04`); the formal two-clean-runs scoring is **not** done |
| 7 interface audit | run as part of the static check |
| 8 parity | 64 → 24 findings, all triaged and recorded |
| 9 continuity | this file, `CLAUDE.md`, `.claude/settings.json`, `.github/workflows/verify.yml`, checkers vendored into `.ptah/` |

**Not done, and known:** the gate 6 scoring loop; a git repository, without which
the hooks and the CI workflow are files nobody runs.

**Failing on purpose:** `R-B1-15`. The client strip autoplays with no visible
pause, no pause on hover and no focus stop, at the author's explicit direction,
given twice. `prefers-reduced-motion` still halts it. The entry stays failing.
