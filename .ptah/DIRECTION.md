# Direction: Cell grid

Chosen at gate 3 on 2026-09-09, **third pass**, after the second direction was built and
rejected. What happened, and why it is recorded rather than quietly overwritten, is at the
foot of this file.

---

## Thesis

The page is a grid of drawn rules. Every block is a cell with an edge; nothing floats,
nothing blurs, nothing is soft. The structure is visible, and the structure is the argument:
this is a tool that reports what it found, in cells, with labels.

## Idiom

**Cell grid**, pinned by the brief. The author's own reference has been the direction since
the first message; six idioms were dealt away from it before that was admitted.

| Axis | The grammar |
|---|---|
| **Surface & material** | Flat. One ground, one cell fill, no texture, no translucency, no depth. A cell is defined by its edge, not by a shadow. |
| **Type & composition** | **Archivo is what you read; Commit Mono is what the machine touches** — cell numbers, labels, eyebrows, values, code. Full-bleed rows; content on one rail; flush left. |
| **Structure & navigation** | Rows stack with no gap, so the rail's two vertical rules run unbroken from the nav to the footer. The nav sits on the same rail. |
| **Controls & state** | A control is a cell. State changes the fill or the text, never the shape. |
| **Motion & response** | Nothing moves except the one orchestrated moment in section 2. |

`register: committed`.

### Non-negotiables

1. **Every block is a cell with a drawn 1px edge.** Nothing carries a fill without an edge,
   and nothing carries a shadow. If a block reads as floating, the idiom did not happen.
2. **The accent appears only as a solid fill**, never as a tint, a border, or text. There is
   one accent fill in the first screen and it is the call to action.
3. **Every band carries a two-digit number and a mono label in the same corner.** The
   numbering is real: it is the section order the reader is moving through.

## Palette

Measured before any component existed. Both themes, WCAG 2.1 and APCA, 13 pairs.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--color-ground` | `#E9EAEE` | `#0B0D11` | The page, between and around cells |
| `--color-cell` | `#FFFFFF` | `#12161C` | A cell's fill |
| `--color-ink` | `#14161B` | `#EDEFF3` | |
| `--color-ink-muted` | `#4F545D` | `#B9BEC7` | |
| `--color-accent` | `#FFD400` | `#FFD400` | Fill only. Identical in both themes. |
| `--color-on-accent` | `#14161B` | `#14161B` | The only ink permitted on the accent |
| `--color-hairline` | `rgba(20,22,27,.47)` | `rgba(237,239,243,.36)` | Every rule in the grid |
| `--color-focus` | `#14161B` | `#FFD400` | |
| `--signal-ok` | `#12855C` | `#5CD6A0` | State only, never decoration |
| `--signal-caution` | `#8A6100` | `#F2C14E` | |
| `--signal-blocked` | `#C0392B` | `#FF6B6B` | |

**Why the neutral is cool and not warmed toward the accent.** E4 asked for a neutral leaning
toward the accent. That answer was given when the accent was magenta; the author later chose
yellow, and a neutral warmed toward yellow is cream, which is the paper look the author
banned outright. The neutral therefore leans cool, away from the accent, which also makes
the yellow read harder by simultaneous contrast. E4 is recorded as changed, with this reason.

**Why the accent is fill-only.** A yellow bright enough to be worth having cannot be text: on
a light ground no yellow that still reads as yellow clears 4.5:1. As a fill with near-black
ink it reaches **12.64:1, Lc 82, with the identical hex in both themes** — which is exactly
what E7 asked for. The constraint produced a better system than the free choice would have.

**Result: 0 WCAG AA failures in either theme.** Five APCA-only warnings, all on secondary ink
and the grid rule, which E7 classes as warnings rather than blocks.

## Typefaces

| Face | Role |
|---|---|
| **Archivo Variable** (OFL) | Display, headings, prose, nav wordmark |
| **Commit Mono** (SIL OFL 1.1) | Band numbers and labels, eyebrows, nav links, values, code |

Both already ship in the product repo at `docs/demo/fonts/`, so the pairing is inherited
rather than invented. E5 assigned Commit Mono to display; that was reversed at gate 3
because a monospace headline reads as "developer tool" to the non-technical reader A3 was
revised to, and the swap earns its keep by meaning something.

## Material, depth and edge

- **The ground is flat.** No texture, no pattern, no image, nothing behind anything.
- **A cell** is `--color-cell` inside a 1px rule on four sides.
- **Separation is drawn**, not lifted and not spaced: the rule does the work.
- **What a shadow means:** *this can be closed*. One shadow value exists, bound to menus. A
  cell never casts one.
- **Radius:** `0` everywhere; `2px` on inputs and inline code; `50%` on the section 2 lamps
  and nowhere else. That lamp is the only curve in the project.
- **Border weight:** `1px` for every rule; `2px` for the focus ring and nothing else.

## Component vocabulary

| Primitive | Earned by |
|---|---|
| `Row` | Every C2 section: a full-bleed band with the numbered eyebrow and the rail |
| `Cell` | Any bounded block inside a band |
| `InstallBlock` + copy control | §1 and §8, the primary CTA |
| `Panel` + `Lamp` | §2 only, the D7 risk |
| `Nav`, `ThemeToggle`, `Mark` | Site chrome |

Not built: accordion, carousel, modal, tab set, card grid, icon tile, badge.

## Signature

**The numbered band header.** Every Row opens with `NN / LABEL` set in Commit Mono, small,
tracked, in the same corner. It recurs once per band, at least once per section, and never
inside a Cell or on a control. It is ink, never accent, because the accent is scarce by rule.

## Motion

Hover, focus and active at 90ms on opacity and transform only. One orchestrated moment: the
section 2 lamp sequence at 320ms per lamp, on a Replay control, never on scroll. Nothing
rests at `opacity: 0`. Under `prefers-reduced-motion` the panels render their final state.

## Layout

Full-bleed rows, a centred rail with a minimum gutter so its vertical rules are always inset
and the grid reads at every width, content flush left inside it. Nothing is centre-aligned.

```
┌──────────────────────────────────────────────────────────┐
│    │ ▓ Svipall              DOCS  SOURCE  ☾ │            │  nav on the rail
├────┼────────────────────────────────────────┼────────────┤
│    │ 01 / WHAT THIS IS                      │            │  ← signature
│    │                                        │            │
│    │ Your agent doesn't                     │            │
│    │ read the web.                          │            │
│    │ It tries to.                           │            │
│    │                                        │            │
│    │ ┌────────────────────────────────────┐ │            │
│    │ │ PASTE THIS INTO CLAUDE CODE…       │ │            │
│    │ ├──────────────────────────┬─────────┤ │            │
│    │ │ Install and configure…   │  COPY   │ │  ← the one │
│    │ └──────────────────────────┴─────────┘ │    accent  │
├────┼────────────────────────────────────────┼────────────┤
│    │ 02 / BEFORE AND AFTER                  │            │
│    │ ┌─────────────────┐  ┌───────────────┐ │            │
│    │ │ A PLAIN FETCH   │  │ WITH SVIPALL  │ │  ← the risk│
│    │ │ ● asked once    │  │ ○ a̶s̶k̶e̶d̶ ̶o̶n̶c̶e̶  │ │            │
│    │ └─────────────────┘  └───────────────┘ │            │
└────┴────────────────────────────────────────┴────────────┘
```

## The one aesthetic risk

Unchanged from D7: **section 2's two annunciator panels.** On a page of quiet cells, two
cells whose contents are lamps rather than words are the loudest thing available. Both
panels list the same five conditions in the same order; the left has all five lit, the right
has all five unlit and struck through. In an annunciator, all-dark is all-clear.

**If it fails**, the fallback is to set the two panels as an ordinary two-column comparison
and accept a quieter §2.

## References

| Reference | Axis | What is taken |
|---|---|---|
| HydraDB (the author's) | structure & navigation | The visible cell grid: 1px rules dividing the page, each block declaring its own edge. Numbered eyebrows. |
| HydraDB | surface & material | Flat ground bled to the edges, radius 0, and the accent as a solid fill behind text rather than a tint. |
| Cloudflare Radar | surface & material | Chrome achromatic; saturated hue only where it means something. Here the accent is one fill per screen. |
| Klim / Söhne | type & composition | One saturated colour used exclusively on the single commercial action; the range between display and the smallest label is the composition. |
| Stripe API docs | structure & navigation | A persistent rail; artefacts that stay put while prose scrolls. Carried into the docs surface. |
| Pagefind | controls & state | A field that advertises its own shortcut; the current item marked by a rule, not a fill. |
| Ghostty | motion & response | The product's own output is the hero image; no decorative motion at all. |
| Aircraft annunciator panel (D4) | controls & state | Two urgency levels by colour *and* form; an unlit lamp stays legible. Binds to §2 only. |

## Rejected directions, so nobody remixes them

| Deal | Name | Idiom | Why it is dead |
|---|---|---|---|
| 1 | Mitred rule | monoline draughtsman's lettering | Family rejected by the author |
| 1 | Field report | analytical report sheet | Family rejected |
| 1 | Signal board | transit signage | Family rejected; also closest to the logo's amber |
| 2 | Vitrine | museum display case | Not chosen |
| 2 | Kiosk | self-service machine | Not chosen |
| 2 | **Interleaf** | acetate overlay sheet | **Chosen, built, and rejected after seeing it.** See below. |

### Why Interleaf died, recorded in full

It was translucent sheets over a continuous underlayer of real raw material. It failed for
three reasons, in order of importance:

1. **The author rejected its foundational non-negotiable.** "Real legible content behind
   every sheet" was the idiom; with the raw material removed there is no idiom left. That is
   a gate 3 decision, not an adjustment, so the direction was abandoned rather than patched.
2. **It could not survive its own blur.** Full-bleed bands covered the viewport, so the
   underlayer was only ever seen through the blur, and at 20px a 12px monospace line is
   destroyed. The non-negotiable passed in the tokens and failed on the screen. Dropping the
   blur to 3px fixed the material and broke the nav, which then had raw text running through
   it.
3. **Built as centred sheets it read as a white card on a grey field**, which is the generic
   composition the whole process exists to avoid. Making the bands full-bleed fixed that and
   is the one thing carried forward into this direction.

The lesson worth keeping: **a non-negotiable that is satisfied in the tokens and invisible on
the screen is not satisfied.** Gate 5's specimen step catches this; it caught it here, one
direction too late.

## Licences

**R-LIC-01** stands, unchanged: `viewport-height-hero`, earned by A5. It is not currently
applied — the rebuilt hero is sized to what it holds — and will be re-applied only if the
paste block falls below the first frame at a normal window height.

Licences in force: **1 of a maximum 3.**
