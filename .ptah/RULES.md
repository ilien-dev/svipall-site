# Rules: Svipall site

Written during the interview and gates 3 and 4, at the moment each decision was made.
Never reconstructed afterwards. The parity loop verifies the built site against this file.
English only: these asserts are grepped by the verifier and read by later agents.

Format:

```
R-<block><question>-<n>   source <origin>
  assert  <one testable sentence>
  verify  <GREP | VISUAL | AUDIT>  <what exactly to check>
```

---

## Prohibitions from the truth ledger

Generated from every item left unchecked in B1. These are the highest-priority rules in
the file.

```
R-B1-01   source Q-B1
  assert  No testimonial, pull quote, avatar or attributed praise appears anywhere.
  verify  GREP + VISUAL

R-B1-02   source Q-B1
  assert  No client or user logo wall appears anywhere.
  verify  GREP + VISUAL

R-B1-03   source Q-B1
  assert  No user count, customer count or install count appears anywhere.
  verify  GREP + VISUAL

R-B1-04   source Q-B1
  assert  No GitHub star, fork, watcher or package download counter is rendered. The
          repository is linked; the number is not shown. Verified 2026-09-09: 0 stars,
          0 forks, 0 watchers.
  verify  GREP + VISUAL

R-B1-05   source Q-B1
  assert  No security or compliance badge appears (SOC 2, ISO 27001 and equivalents).
  verify  GREP + VISUAL

R-B1-06   source Q-B1
  assert  No team page, org chart, headshot or biography appears. The maintainer handle
          `ilien` linked to github.com/ilien-dev is the only identity claim permitted.
  verify  GREP + VISUAL

R-B1-07   source Q-B1
  assert  No physical address or legal entity appears.
  verify  GREP + VISUAL

R-B1-08   source Q-B1
  assert  No price, plan, tier, "free tier", commercial licence or support offer appears.
  verify  GREP + VISUAL

R-B1-09   source Q-B1
  assert  Nothing on the site offers to run Svipall in the browser, and no section
          promises trying it without installing. Recorded NOT YET.
  verify  GREP + VISUAL

R-B1-10   source Q-B1
  assert  The 160/160 automation-tell probe result does not appear. Declined by the author.
  verify  GREP

R-B1-11   source Q-B1
  assert  The historical public31 figures (93 cells, 59, 44) do not appear. Declined by
          the author.
  verify  GREP

R-B1-12   source gate 2
  assert  The phrase "confidence index", "confidence score", "trust score", and any
          wording implying Svipall ranks pages by trustworthiness or filters out pages,
          appears nowhere. It labels what arrived; it does not discard.
  verify  GREP + AUDIT

R-B1-13   source gate 2
  assert  Wherever the site mentions percentiles or calibration, it carries the stated
          limit: below 30 local observations no percentile is returned, and these are not
          validated confidence intervals nor a representative sample of the web.
  verify  AUDIT

R-B2-01   source Q-B2
  assert  Every number on the site resolves to a row of the truth ledger in BRIEF.md
          section B, and carries the method or source that produced it.
  verify  AUDIT  each rendered figure traced to a ledger row

R-B2-02   source gate 2   the comparison's honesty
  assert  In the section 2 before-and-after, every claim on the "without Svipall" side
          describes documented behaviour of a client's built-in fetch and is as defensible
          as every claim on the Svipall side. No strawman, no invented failure, no
          unattributed "most tools" claim.
  verify  AUDIT  each left-panel line traced to a source, exactly as the right-panel lines
```

---

## Surface and structure

```
R-A2b-01   source Q-A2b
  assert  This build is a PERSUADE surface. Gate 7 runs interface-audit.md alone. Gate 6
          scores five criteria. The docs section is a separate READ surface, built later
          through extend mode, inheriting this ledger and adding its own R-A2b entry.
  verify  AUDIT  the parity report names the audit file and the criteria count

R-C2-01   source Q-C2, revised gate 2
  assert  The home contains exactly these eight sections, in this order: hero with the turn
          and the install block; before and after; what you ask then what it does then what
          it hands back; the four problems in plain words; things you can ask for; why you
          can believe it; if you open a terminal; final CTA with licence and disclaimer.
  verify  GREP + VISUAL

R-C2-02   source gate 2   the jargon line
  assert  Sections 1 to 6 contain none of: tier, MCP, server, JSON, HTTP, API, CLI,
          endpoint, header, status code, field name, crate, binary, Rust, headless,
          stealth, fingerprint. "Markdown" appears only with a plain gloss on first use.
          Section 7 and the footer are exempt: that is where the technical reader is
          addressed.
  verify  GREP  case-insensitive, scoped to sections 1-6

  ONE EXCEPTION, added at gate 5 with its reason. The hero's demonstration shows a single
  real command line, `svipall fetch example.com/pricing`. A command is jargon by any
  reading of this rule. It is permitted because the macrostructure is demonstration-first
  and the author asked for the product to be shown rather than described, and because
  every other line in that block is a plain sentence. The exception binds to that one
  line in section 1. It does not license a second command anywhere in sections 1-6.

R-C5-01   source Q-C5
  assert  One primary CTA: a copyable block pointing at docs/install.md. One lighter
          secondary: "How it was measured" pointing at /docs/proof. No third CTA of
          comparable weight; Docs and GitHub sit in the nav without CTA styling.
  verify  GREP + VISUAL

R-C6-01   source Q-C6
  assert  Every string that ships on screen is English.
  verify  GREP

R-G3-02   source gate 3
  assert  The macrostructure is DEMONSTRATION-FIRST: the real thing works at full width
          before any argument is made. No other page in this project reuses it without a
          recorded reason; the docs surface uses REFERENCE.
  verify  VISUAL  the section rhythm matches the recorded skeleton
```

---

## Idiom

Rewritten at gate 3 pass 3, on 2026-09-09, after the Interleaf direction was built and
rejected. The full record of why it died is in DIRECTION.md; it is kept rather than deleted
so no later session revives it.

```
R-G3-03   source gate 3 pass 3
  assert  The idiom is CELL GRID: a page of drawn rules where every block is a cell with an
          edge. It is present in the nav, the bands, the cells, the controls and the empty
          states, not in one place.
  verify  VISUAL  a reviewer given the captures and no source names a ruled board of cells

R-G3-04   source gate 3 pass 3   non-negotiable 1
  assert  Every block is a cell with a drawn 1px edge. Nothing carries a fill without an
          edge, and nothing carries a shadow except the one overlay value.
  verify  GREP  every filled block declares a border; VISUAL  nothing reads as floating

R-G3-05   source gate 3 pass 3   non-negotiable 2   amended at gate 5
  assert  The accent appears only as a solid fill, never as a tint, a border, or text.
          It is permitted in exactly two roles: the call to action, and a <mark> highlight
          behind a key phrase. At most TWO highlights per band, and exactly ONE accent
          fill on the page is a control. Highlights mark; only the call to action acts.
  verify  GREP  no color: var(--color-accent) and no border-color: var(--color-accent)
          outside the accent cell variant; count of <mark> per section <= 2; VISUAL

  WHY IT WAS AMENDED. The author asked for accents in the copy so the text would not read
  flat, naming the URL specifically. The accent cannot be text: that is a measurement, not
  a preference, and R-G3-14 records it. A highlight is the same fill with ink on top, which
  is the one pairing that reaches 12.64:1 in both themes, so the request is satisfied
  without touching the contrast floor. The cap is what keeps scarcity meaning something:
  without it the accent stops being the thing the eye goes to.

R-G3-06   source gate 3 pass 3   non-negotiable 3
  assert  No backdrop-filter, no blur, and no translucent surface exists anywhere in the
          project. Every surface is opaque.
  verify  GREP  zero occurrences of backdrop-filter and blur(

R-G3-07   source gate 3 pass 3   border widths
  assert  Border widths are exactly 1px, used for every rule in the grid, and 2px, used
          solely for the focus ring. No other edge weight appears.
  verify  GREP  ptah-check border-width-literal against scales.borderWidth

R-G3-08   source gate 3 pass 3   the depth model
  assert  A shadow means "this can be closed". Exactly one shadow value exists and it is
          bound to menus. A cell never casts one.
  verify  GREP  shadow-literal against scales.shadow; VISUAL

R-G3-09   source gate 3 pass 3   the signature
  assert  The signature is the NUMBERED BAND HEADER: a two-digit number and a mono label
          in the same corner of every band, set in Commit Mono, small and tracked. It
          appears once per Row and at least once per section, and never inside a Cell, on
          a control, or in the nav. The numbering is the real section order.
  verify  GREP  ptah-check idiom-unrealised against row__num; VISUAL

R-G3-10   source gate 3 pass 3, amended at gate 5   component vocabulary
  assert  The project builds only these primitives: Row, Cell, Terminal, Clients,
          InstallBlock (including its two-way switch), Panel, Lamp, Nav, ThemeToggle,
          Mark. No accordion, modal, card grid, icon tile or badge exists.
  verify  AUDIT + GREP

  WHAT WAS ADDED, AND WHY, rather than smuggled in.
  Terminal  — C2 section 1 needed a demonstration, and the macrostructure is
              demonstration-first. It became the project's one orchestrated moment.
  Clients   — the harnesses it installs into, at the author's direction, as marks on a
              moving belt. Recorded twice over in the accepted-against-advice table.
  A tab set inside InstallBlock — the original rule refused one outright. There are two
              real install paths, both documented in the README and neither a variant of
              the other: the pasteable prompt any agent can follow, and the Claude Code
              plugin commands. A control is what a genuine either/or earns; the refusal
              was aimed at tabs used to hide content that should have been on the page.
              The active tab is marked with ink and a rule, never with the accent, because
              exactly one accent fill on the page is allowed to be a control.

R-G3-11   source gate 3 pass 3   alignment
  assert  Rows are full-bleed; their content sits on one centred rail with a minimum
          gutter so the rail's vertical rules are always inset and visible. Content inside
          the rail is flush left. No text is centre-aligned.
  verify  GREP  no text-align: center outside the panel lamp legends; VISUAL

R-G3-12   source gate 3 pass 3   the type semantic
  assert  Commit Mono sets only band numbers and labels, eyebrows, nav links, values,
          units, panel legends and code. It never sets a heading. Archivo sets everything
          a person reads, including the hero.
  verify  GREP  no font-family resolving to Commit Mono on h1-h6

R-G3-13   source gate 3 pass 3   what must not appear
  assert  No radial glow, no gradient of any kind, no coloured box-shadow, no texture and
          no image sits behind any section. The ground is flat.
  verify  GREP + VISUAL

R-G3-14   source gate 3 pass 3
  assert  The accent never sets text. Links are ink with a rule underneath; the accent is
          the CTA fill and nothing else in the first screen.
  verify  GREP + VISUAL

R-E4-01   source Q-E4, revised gate 3 pass 3
  assert  The neutral leans cool, away from the accent.
  verify  GREP  no achromatic grey and no warm neutral is declared

  WHY E4 CHANGED. The interview answered "neutral leaning toward the accent" when the
  accent was magenta. The author later chose yellow. A neutral warmed toward yellow is
  cream, which is the paper look the author banned outright in the first message. Leaning
  cool also makes the yellow read harder by simultaneous contrast. The reason is recorded
  because the ledger must not appear to contradict itself silently.
```

---

## Licences

None in force. Cap is three per project.

The craft floor is never licensable. One floor rule was tested against this brief and held:
the docs measure was proposed at ~78ch in the interview and corrected to ~72ch, because
45–75ch is craft floor rather than taste.

---

## Foundations

```
R-E1-01   source Q-E1
  assert  Every font-size resolves to the declared fluid type scale. Resolved endpoints:
          11/12, 13/14, 15/17, 18/21, 22/27, 28/36, 36/52, 46/76 px between 390px and
          1440px viewport.
  verify  GREP  no font-size literal outside the token declarations

R-E2-01   source Q-E2
  assert  Every padding, margin and gap resolves to the 4-point scale:
          4 8 12 16 24 40 64 96 128 px.
  verify  GREP  no spacing literal outside the token declarations

R-E2b-01   source Q-E2b
  assert  Border-radius is 0, 2px or 50%. 2px binds to inputs and inline code chips only;
          50% binds to the tier-panel status lamp only. No pill radius exists anywhere.
  verify  GREP  radius-literal against scales.radius; VISUAL  the only curve on the page
          is the lamp

R-E2b-02   source Q-E2b
  assert  Exactly one box-shadow value exists in the project, bound to the search dialog
          and menus. Everything else separates with a 1px hairline plus a surface-value
          shift. If it has a shadow, it can be closed.
  verify  GREP  shadow-literal against scales.shadow

R-E2b-03   source Q-E2b
  assert  Every z-index is one of 0, 10, 100, 1000, 1100.
  verify  GREP  z-index-literal against scales.zIndex

R-E2b-04   source Q-E2b
  assert  Every transition and animation duration is 90ms, 180ms or 320ms, outside
          prefers-reduced-motion blocks.
  verify  GREP  duration-literal against scales.duration

R-E3-01   source Q-E3
  assert  The semantic colour set (ok, caution, blocked) appears only where a state is
          being reported: lamps, verdict rows, status badges. It never appears as
          decoration, section colour or illustration fill.
  verify  GREP + VISUAL

R-E4-01   source Q-E4
  assert  Every neutral token carries 3–6% of the accent's chroma. No achromatic grey
          (#888, #666, gray-500 and equivalents) is declared.
  verify  GREP  colour literals resolved against palette

R-E5-01   source Q-E5
  assert  Display and code are Commit Mono; body is Archivo. No face this project refused
          appears as a primary family. Generic fallbacks at the end of a stack are the
          craft floor being met, not the refusal being broken.
  verify  GREP  the first family in every font-family declaration

R-E5-02   source Q-E5
  assert  Every declared face has a real fallback stack: Commit Mono falls back to
          ui-monospace, SFMono-Regular, monospace; Archivo falls back to system-ui,
          sans-serif.
  verify  GREP

R-E6-01   source Q-E6
  assert  Only transform and opacity are animated. No `transition: all` appears.
  verify  GREP

R-E6-02   source Q-E6
  assert  prefers-reduced-motion is honoured: the tier panel renders its final state and
          the Replay control is hidden or inert.
  verify  GREP + VISUAL

R-E6-03   source Q-E6
  assert  Nothing rests at opacity 0 waiting for an observer. No IntersectionObserver
          drives an entrance anywhere on the site.
  verify  GREP + VISUAL  first frame with JS disabled shows all content

R-E6-04   source Q-E6, revised gate 5
  assert  The one orchestrated moment is the HERO's demonstration replay, triggered on load
          and by its own Replay control, and by nothing else. Section 2's lamps are static.
          The whole transcript is present in the HTML at rest, so a reader with no
          JavaScript or with prefers-reduced-motion sees the finished state rather than an
          empty frame; the replay only hides what is already there and brings it back.
  verify  GREP + VISUAL  first frame with JS disabled shows every transcript line

  WHY IT MOVED. E6 allows one orchestrated moment. The author asked for the hero to show
  the tool working, animated. Two orchestrated moments would be two, so the lamps gave
  theirs up. They still carry section 2: five lit against five struck through.

R-E6-05   source gate 5   the demonstration is not evidence
  assert  The hero demonstration carries its caption stating that it is an illustration
          and not a recording, in view and not in a tooltip, and it contains no figure of
          any kind. A terminal frame reads as evidence whether or not it is one.
  verify  GREP + VISUAL

R-E7-01   source Q-E7
  assert  All eighteen declared contrast pairs meet WCAG AA in both themes. APCA is
          computed and reported separately; an AA pass that fails APCA is a warning.
  verify  AUDIT

R-E8-01   source Q-E8
  assert  Measure stays within 45–75ch in both density settings. Home targets ~68ch,
          docs ~72ch.
  verify  GREP + VISUAL
```

---

## Art direction

```
R-D2-01   source Q-D2
  assert  No rune, knotwork background, horn, raven, parchment texture, gold gradient or
          saga lettering appears. The knotwork inside the existing mark is the only
          knotwork on the site.
  verify  GREP + VISUAL

R-D2-02   source Q-D2
  assert  No sparkle, wand, star-burst or violet AI gradient appears, and no copy
          anthropomorphises the agent.
  verify  GREP + VISUAL

R-D2-03   source Q-D2
  assert  No phosphor green, glitch effect, skull, hooded silhouette other than the mark,
          code rain or scanline appears.
  verify  GREP + VISUAL

R-D5-01   source Q-D5
  assert  The mark renders monochrome: --svipall-ink and --svipall-rust both resolve to
          the ink token, --svipall-bone to the ground token, and --svipall-amber to the
          accent token. The eye is the only saturated point in the mark.
  verify  GREP + VISUAL

R-D5-03   source Q-D5, reversed at gate 5 at the author's direction, then widened
  assert  The palette is derived from the logo, not only the accent. In dark the ground
          is the logo's navy #0B1A2B exactly, the cell is one step up from it, and the ink
          warms toward the logo's bone. The accent is #FFB03A, the logo's amber lifted
          until it clears. The logo's rust #A7472C is the "blocked" signal, which is what
          it already meant on the mark. D5 recorded the original palette as refused for
          the site; that refusal is lifted, deliberately and in full.

  WHAT DID NOT COME ACROSS, and why it is a measurement rather than taste.
    bone as a light ground   1.15:1 against the light theme's own ground: it disappears.
                             It is also the paper colour the author banned in the first
                             message. The light theme stays cool and deliberately not
                             cream; bone survives only as the warm cast of the dark ink.
    navy as an accent        it is the ink; a thing cannot be both.
    rust as the accent       3.09:1 with dark ink. It works with white ink, which would
                             mean two inks on accents. It became the blocked signal
                             instead, where it is doing more work than it would have as
                             an accent.

  THE COLLISION, resolved rather than left as a note. Caution was an amber and the accent
  is now an amber: two ambers meaning different things is a state nobody can read. Caution
  moved to a blue. The accent did not move off the logo to make room for a signal.
  status  A REVERSAL, recorded rather than quietly overwritten.

  WHAT WAS MEASURED BEFORE REVERSING, since the constraint is not a matter of taste.
  The accent is fill-only and needs a strong pair with dark ink at one hex in both themes.
    amber #DF8D27, the logo's own   6.87:1, Lc 52   passes AA, sits where the rejected
                                                    magenta sat, so the CTA label becomes
                                                    the weakest text on the page again
    rust  #A7472C                   3.09:1 with dark ink; needs white ink instead
    bone  #EAD9C4                   13.12:1 with ink, but 1.15:1 against the light ground,
                                    so it vanishes in light theme; and it is the paper
                                    colour the author banned in the first message
    navy  #0B1A2B                   cannot be an accent: it is the ink
    #FFB03A, same hue family        9.93:1, Lc 69   shipped
  Two of the four brand colours are unusable as a fill-only accent for reasons that hold
  regardless of preference. The shipped value is the logo's amber lifted until it clears.

  A COLLISION TO WATCH, recorded now rather than discovered later. --signal-caution is an
  amber (#F2C14E dark, #8A6100 light) and the accent is now also an amber. Nothing uses
  caution today, so nothing is broken; the moment something does, caution must be
  distinguishable from the accent by form as well as hue, or it changes hue.
  verify  GREP  the palette; VISUAL  the mark's eye is amber in both themes

R-D5-02   source Q-D5
  assert  None of the original brand hexes (#0B1A2B, #A7472C, #EAD9C4, #DF8D27, #12161F)
          appears as a literal anywhere in the site source.
  verify  GREP

R-D6-01   source Q-D6
  assert  Every token is declared in bare :root before any media or attribute block
          redefines it. Dark is redefined under both
          @media (prefers-color-scheme: dark) guarded as :root:not([data-theme="light"])
          and :root[data-theme="dark"]. body carries an explicit background token.
  verify  GREP

R-D7-01   source Q-D7, revised gate 2
  assert  The one aesthetic risk is the before-and-after in section 2, rendered as two
          facing annunciator panels, and nowhere else. Every other section is composed
          quietly, and no second panel appears anywhere on the site.
  verify  VISUAL

R-D7-02   source Q-D7   from D4
  assert  In both panels an unlit lamp remains legible: its label meets the UI contrast
          target against the panel surface. The off state is designed, because half the
          argument is what is missing on the left.
  verify  AUDIT + VISUAL

R-D7-03   source gate 2
  assert  The six tier names (HTTP, BROWSER, STEALTH, REAL, WARM, NATIVE) appear nowhere
          on the home. On the home the ladder exists only as a plain phrase such as
          "it tries six ways"; the named tiers live in /docs.
  verify  GREP

R-D8-01   source Q-D8
  assert  Home copy is second person and contains no exclamation mark. Docs copy is
          declarative, avoids second person, and preserves the hedges the source
          documents use ("heuristic", "not proof", "does not guarantee").
  verify  GREP + VISUAL

R-G3-01   source gate 3
  assert  A third-party mark may keep its own brand colour, and ONLY that: the exception
          is one hex per mark, bound to the element that shows the mark, never reused for
          anything else and never added to the project palette. Today that is #D97757,
          Claude's own, on the plugin tab.
          Recoloring someone else's mark to fit a palette is worse than showing it as it
          is, which is why this exception exists rather than a tinted version of the mark.
          Otherwise the palette is exactly: #0D0B10 #1A1720 #14111A #F2EFF4 #BDB4C2 #FF66A8
          #5CD6A0 #F2C14E #FF6B6B #DED7DE #EFEBEF #FFFFFF #16131A #5D5566 #C4005F
          #12855C #8A6100 #C0392B, plus the four declared rgba() compositions
          (--color-underlayer-ink, --color-sheet, --color-hairline in each theme). No
          other colour literal appears outside src/styles/tokens.css.
  verify  GREP  ptah-check color-literal against palette
```

---

## Copy

```
R-H1-01   source gate 4   PENDING
  assert  Section copy matches COPY.md word for word.
  verify  GREP

R-H1-02   source gate 4
  assert  None of the banned words appear: revolutionize, supercharge, unlock,
          effortless, seamless, "the future of", "game-changing", "blazingly fast",
          "just works", "magic".
  verify  GREP

R-H1-03   source Q-A4, Q-B3
  assert  No claim of guaranteed success against any anti-bot vendor appears. Every
          capability statement that the source documents hedge is hedged here too.
  verify  AUDIT
```

---

## Interface

```
R-AU-01   source gate 7
  assert  Zero MUST violations in the interface audit.
  verify  AUDIT
```

---

## Session flags

| Flag | Value |
|------|-------|
| Surface | persuade (home). Docs = read surface, later, via extend mode |
| Macrostructure | demonstration-first |
| Idiom | interleaf — the acetate overlay sheet, and the transparency on a light table |
| Register | committed |
| Non-negotiables | ① real legible content behind every sheet, never a flat fill ② running text on its own opaque patch ③ one blur radius and one alpha in the whole project |
| Signature | the aperture: an unblurred window cut through every sheet, bottom-left |
| humanizer | will run (detected at ~/.agents/skills/humanizer) |
| Trust level | 2 — Builds |
| Licences in force | none. Three refused defaults landed on (glass, `01 02 03`, mono labels) and all three are named by the idiom before the code |
| Warnings accepted against advice | **2.** (i) Third-party marks are shown as icons. The trademark and implied-endorsement objection was raised twice and overruled twice; R-B1-14 records what survives of it. (ii) The client strip auto-scrolls. `slop-catalog.md` lists the auto-scrolling marquee with an earn of "nothing: it hides content and takes attention", and E6's one orchestrated moment was already spent on the hero demonstration. The author was given both costs and chose it anyway. Recorded here rather than written as a licence, because the catalogue admits none for this. Gate 8 will report it on every run, and that report is correct. |
| Rules rewritten to be testable | docs measure 78ch → 72ch, to stay inside the craft floor |
| Changed by measurement at gate 3 | hairline alpha .22→.42 dark and .16→.52 light; accent #D6006B→#C4005F light; muted ink #A79FAE→#BDB4C2 dark; accent barred from body-size text |
| Contrast status at gate 3 | 0 WCAG AA failures in both themes; 8 APCA-only warnings, all dark, two of them named for gate 6 to look at |
| Checks disabled, and why | none disabled. One craft-floor item is **failing and reported**: R-B1-15, the marquee's stop affordance — the visible control removed at gate 5 and pause-on-hover at gate 6, both at the author's direction. It is not disabled, licensed or reworded — it fails, and the report says so. |
| Baseline findings (adopt mode only) | n/a — build mode |

---

## Licences (written at gate 5)

```
R-LIC-01   source gate 5   licence  (kind A)
  claims   viewport-height-hero: a full-viewport opening section
  earns    A5. The single job of this page is that the visitor copies one line and pastes
           it into their agent. That block lives in the hero, and a hero the reader has to
           scroll to finish puts the page's only job below the first frame. The earn is the
           brief line, not the author's request for it.
  binds    src/pages/index.astro, the .hero rule only. Every other section is sized to what
           it holds. Implemented as min-height with svh, never height and never vh, so the
           section grows rather than clipping when the content does not fit.
  verify   VISUAL  the install block and its copy control are fully inside the first frame
           at 1440, 768 and 390; and at 390 the hero is taller than the viewport rather
           than clipped
```

Licences in force: **1 of a maximum 3.**

---

## Motion between states (added at gate 5)

```
R-E6-06   source gate 5, from a correction requested twice
  assert  A change between two views of the same thing transitions; it does not cut.
          Tab panels, switch options and any menu that swaps content cross-fade over
          --dur-reveal, and any indicator that marks which option is current moves rather
          than jumping. This is a state change, not an orchestrated moment, so it does not
          spend E6's budget of one.
  bounds  Only transform and opacity are animated. An indicator is moved with transform,
          never with width, left or top: those are layout properties and animating them
          forces a reflow on every frame. Under prefers-reduced-motion everything lands in
          its final state with no transition.
  verify  GREP  no transition or animation naming a layout property; VISUAL  switching a
          tab shows a fade and a moving marker

  WHY IT IS A RULE AND NOT A PREFERENCE. It was asked for twice: once for the terminal,
  where the take was switching with a hard cut, and again for the install switch. A cut
  between two states reads as a glitch rather than as a change, because nothing tells the
  eye that the second thing is the same thing in another state.
```

---

## Narrow-width verification (gate 6, run 2026-09-09)

The responsive check that gate 5 deferred rather than asserting from the CSS. Both
widths were rendered in a real browser at the site's own build output, not reasoned
about. It found two defects that only exist below 900px, which is the whole reason
the check was not allowed to be a reading of the source.

```
R-G6-01   source gate 6, measured
  assert  R-LIC-01's licence verifies at all three widths.
  evidence  install block copy control, bottom edge against the viewport:
            1440x900   838 <= 900   inside the first frame
             768x1024  652 <= 1024  inside the first frame
             390x844   702 <=  844  inside the first frame
            hero height 962 / 1321 / 1374 against viewports 900 / 1024 / 844: the
            section grows past the frame at every width rather than clipping, which
            is what min-height with svh was chosen to do.
  status  PASS
```

```
R-G6-02   source gate 6, a defect found and fixed
  assert  The terminal transcript fills its panel at every width.
  found   .term__stage carries justify-content: center for its flex layout, where it
          centres the takes vertically. When .is-cycling switches it to grid, that same
          property centres the column track instead, and an implicit grid track is
          max-content. At 1440 the longest line was wider than the panel, so the
          centring had nothing to move and the bug was invisible. At 768 the transcript
          floated 90px in from the panel's left edge with the verdicts stranded in the
          middle.
  fix     One explicit track, grid-template-columns: minmax(0, 1fr), so it fills and can
          still shrink rather than overflow.
  measure take left/width against the stage's content box: 172/410 inside 82/589 before,
          98/557 after, which is the padding edge exactly.
  status  FIXED
```

```
R-G6-03   source gate 6, a truth defect found at a width
  assert  Copy that describes the layout stays true when the layout changes.
  found   Section 2's lede read "On the left, what a plain fetch brings back. On the
          right, the same request through Svipall." At 768 and below the two panels
          stack, so the sentence described an arrangement that was not on the screen.
          A spatial claim is still a claim, and B's honesty constraint does not stop at
          the desktop breakpoint.
  fix     "First, what a plain fetch brings back. Then the same request through Svipall.
          Both panels ..." — an order rather than a direction, true at every width.
  status  FIXED
```

```
R-G6-04   source gate 6, at the author's direction — R-B1-15 widened
  was     The belt paused on hover and on focus-within.
  now     It does not pause for the pointer. Requested directly: the motion is to be
          continuous.
  and     :focus-within was removed with it rather than kept. Nothing inside the belt can
          take focus - the items are list elements holding aria-hidden SVGs, with no link,
          no control and no tabindex - so that selector could never have matched. Keeping
          it would have left an accommodation that reads as present in the source and does
          nothing on the screen, which is worse than not having one.
  cost    A reader who is not covered by prefers-reduced-motion but still finds moving
          logos distracting now has no way to stop them. That is the actual price and it
          is the author's to pay, not mine to hide.
  stands  prefers-reduced-motion still halts the belt outright. That one is craft floor
          and is not waivable by anyone, including on request.
  status  R-B1-15 remains FAILING, now for two removals rather than one.
```

---

## The docs surface (extend mode, 2026-09-09)

```
R-A2b-02   source gate 1 of the docs extend
  assert  The docs are a READ surface. They inherit this ledger, the tokens and the
          cell grid idiom, and change register and density rather than idiom: compact
          spacing, 72ch measure, report register, no second person.
  binds   src/content/docs/*.md (twelve pages), src/layouts/Docs.astro,
          src/pages/docs/. The home stays a PERSUADE surface and keeps R-C2-02's
          jargon rule; the docs are explicitly exempt from it, which is the whole
          reason they are a separate surface.
  verify  VISUAL + the sidebar, prose and on-this-page list read as three cells of
          one ruled board
```

```
R-A2b-03   source gate 1 of the docs extend
  assert  Every docs page names, in its front matter and at its foot, the file in the
          product repository it was written from.
  why     B's honesty constraint applies here exactly as on the home. A docs page
          with no source is a page someone invented, and twelve of them is a surface
          nobody can check. The foot also states which one wins on a disagreement:
          the repository file, because it ships with the code and this does not.
  verify  GREP  the collection schema requires `source:`, so a page without one fails
          the build rather than shipping unattributed
```

```
R-G9-01   source gate 9
  assert  An internal link that points at a page which does not exist fails the build.
  why     The home shipped for a while linking to /docs, /docs/proof, /docs/privacy
          and /docs/limits before any of them was written. Nothing caught it: a static
          build has no opinion about an href. Four dead links were found by reading
          the page and remembering what had not been built yet, which is not a method.
  binds   .ptah/check-links.mjs, run over dist/ after every build. Anchors are checked
          too: a link to a renamed heading is the same failure, quieter.
  verify  node .ptah/check-links.mjs  ->  14 routes, no broken internal links
```

---

## Gate 7 and 8, run 2026-09-09

The static checker went from **64 violations to 24**. Below is what it found, what was
wrong with the checker's own inputs, and why each of the twenty-four that remain
stands.

### Real defects it found, and fixed

```
R-G8-01   the licence licensed a mechanism that is not in the build
  found   R-LIC-01 claimed `viewport-height-hero` and bound it to "the .hero rule in
          src/pages/index.astro, implemented as min-height with svh". There is no
          .hero rule. There is no `svh` anywhere in the home. The mechanism died with
          the Interleaf redesign and the licence was never withdrawn.
  worse   R-G6-01, written earlier the same day, reported that licence as PASS and
          cited measurements for it. The measurements were real, but they verified a
          CONSEQUENCE - the copy control sits inside the first frame - of a mechanism
          that is not there. A licence is a claim about how a thing is built, and that
          claim was false. R-G6-01 is corrected here rather than deleted.
  fix     The licence is withdrawn. `licences: []`. The hero is sized by its content
          like every other band, which is what it was actually doing all along.
  status  FIXED. Licences in force: 0 of a maximum 3.
```

```
R-G8-02   the dark theme failed the APCA body floor while passing WCAG AA
  found   --color-ink-muted, which sets nearly all body text, measured Lc 58.2 on the
          cell and Lc 59.7 on the ground in the dark theme, against a body floor of
          75. It passes WCAG at 7.39:1 - which is exactly the case where WCAG 2
          misjudges light text on a dark ground. The earlier claim of "0 failures in
          both themes" was a WCAG claim reported as though it covered both measures.
  also    --signal-blocked measured Lc 43.9 against a UI floor of 45.
  and     the light theme had never been measured against this floor either:
          --color-ink-muted on the ground was Lc 70.7, also short of 75. The checker
          did not report it, because it labels both themes and computes the dark pair
          twice. That labelling bug is why the light failure went unseen; the fix here
          does not depend on the checker, because the values were measured directly.
  fix     Measured, not adjusted by eye. Searched along the logo's own bone family so
          the ink and the muted ink stay one family rather than one warm and one cool:
            light  --ds-ink-600  #46525F -> #3B4550   Lc 87.6 cell / 75.6 ground
            dark   --ds-ink-600  #A8B4C2 -> #DAD5CA   Lc 78.5 cell / 80.0 ground
            dark   --ds-red-700  #F0705A -> #FE775F   Lc 48.7 cell / 50.1 ground
  cost    On a dark ground the floor allows only a small step between ink and muted:
          11.5 Lc, where the old palette took 31.8. "Muted" on dark is now a quieter
          warmth rather than a quieter grey. That is what the measurement permits, and
          the alternative is body text below the legibility floor.
  status  FIXED
```

```
R-G8-03   the skip link animated a layout property
  found   .skip parked itself off-screen with a negative `top` and transitioned `top`.
          A reflow on every frame of the one movement a keyboard user sees before
          anything else, and it contradicts R-E6-06's own bounds.
  fix     Parked with transform: translateY(), transitioned on transform.
  status  FIXED
```

```
R-G8-04   a colour literal outside the token layer
  found   #D97757, Anthropic's orange, written inline twice in index.astro for the
          Claude Code plugin mark.
  fix     Declared as --brand-claude in tokens.css, with what it is and what it may
          never be used for. It is a third party's colour and not part of this
          palette; it lives in the token layer only so that layer stays the single
          place a raw value exists.
  status  FIXED
```

```
R-G8-05   a forbidden-evidence pattern that could never match
  found   The endorsement pattern was written in rules.json as "\b(endorsed|...)\b".
          In JSON, \b is a backspace character, not a regex word boundary, so the
          pattern carried two literal 0x08 bytes and matched nothing, ever.
  weight  That is the pattern guarding R-B1-14 - third-party marks must never imply
          endorsement - on a page carrying eleven third-party marks at the author's
          instruction. It has been dead the whole time.
  fix     "\\b(...)\\b". All sixteen patterns now compile, and that is asserted.
  note    This is the SECOND silent hole of this kind in this file. The first was
          nineteen patterns carrying an inline (?i) prefix, which the checker's
          `new RegExp(pat, "i")` threw on and a bare `catch { continue }` discarded. A
          pattern file that fails open is worse than no pattern file, because it
          reports clean.
  status  FIXED
```

### Patterns that were wrong, not code that was wrong

Four patterns banned things the ledger does not forbid. Each is narrowed to what its
rule actually says, rather than the code being contorted to satisfy a bad pattern.

```
R-G8-06   over-broad patterns, corrected
  /\bpublic31\b/            R-B1-11 forbids the historical public31 FIGURES - 93
                            cells, 59, 44 - not the name of the list. The proof page
                            has to name the list in order to report the figures the
                            author did allow. Narrowed to the three figures.

  /\b(HTTP|BROWSER|STEALTH|REAL|WARM|NATIVE)\b.*\btier\b/
                            banned the documented tier ladder across the whole site,
                            including the docs, whose subject is that ladder. The home
                            is already covered where it belongs: R-C2-02's jargon rule,
                            scoped to sections 1-6. Removed.

  /#0B1A2B/ /#A7472C/ /#DF8D27/
                            the logo's hexes, forbidden when D5 refused the brand
                            palette. The author reversed that decision (R-D5-03) and
                            those colours ARE the palette now. Removed. #EAD9C4 and
                            #12161F remain refused and remain in the list.

  /\b(pricing|per month|...)\b/
                            "pricing" matched a user's own words - "summarise the
                            pricing" - and a curl example's query string. Narrowed to
                            price-shaped evidence. The first narrowing still matched
                            `$1` inside a JavaScript replacement string, so it now
                            requires two digits or a decimal.
```

### The twenty-four that remain, and why each stands

Reported every run rather than silenced. `disabledChecks` is still empty.

| count | finding | why it stands |
|---|---|---|
| 3 | `font-no-fallback` on the @font-face rules | A `@font-face` descriptor binds a name to a file; it cannot carry a fallback stack by construction. The stacks live on `--font-body` and `--font-mono`, which is where a fallback can exist. |
| 6 | `all-caps-body` and `wide-tracking-body` in prose.css | The three selectors are `h4`, `th`, and a `blockquote` label. All three are labels rather than running text, and they use the same mono-uppercase eyebrow the rest of the site uses. |
| 5 | `measure` below 45ch | Every one is a heading: `.claim__title`, `.problem__title`, `.beat__head` and two hero headings, all at `--text-lg` or larger. The 45-75ch window is a body measure; a heading ragged at 24ch is a decision. |
| 4 | `color-literal` `#000` in Clients.astro | Inside `mask-image`. A mask reads the alpha channel only, so `#000` there means "opaque" rather than a colour. A token for it would name something that is not a colour decision. |
| 2 | `rest-opacity-zero` in Terminal and InstallBlock | Both `opacity: 0` rules sit under a class JavaScript adds (`.is-cycling`). With no JS, and under `prefers-reduced-motion`, every take and every panel is visible and finished. The checker cannot see the guard. |
| 4 | `img-no-alt` and `img-no-dimensions` in Mark.astro line 5 | Line 5 is a comment explaining why the mark must NOT be loaded through `<img src>`. The scanner matched the `<img>` written inside the prose of that comment, and reports it twice. There is no image element in the file. |

---

## Gate 8, second run: the check is clean

**0 violations, 16 suppressed with `ptah-allow`.** `disabledChecks` is still empty:
nothing is switched off. Every suppression carries its rule id on the line it
applies to, is printed under "Suppressed (visible on purpose)" on every run, and is
listed below with its reason.

The twenty-four findings of the first run resolved as eight real fixes and sixteen
false positives.

### Fixed at the source, not suppressed

```
R-G8-07   the mask channel was a colour literal
  found   #000 four times in Clients.astro, inside mask-image.
  think   A CSS mask reads the alpha channel only, so that value means "opaque"
          and its hue is never seen. It is not a colour decision. But the project's
          own rule is that the token layer is the ONE place a raw value lives, and
          a raw value in a component is a raw value whatever it means.
  fix     Declared --mask-on in tokens.css, saying in as many words that it is not
          a colour and must never be painted with. Four literals gone.
  status  FIXED
```

```
R-G8-08   a comment was being read as markup
  found   img-no-alt and img-no-dimensions on Mark.astro line 5 - a line inside the
          file's opening comment, which explained why the mark must NOT be loaded
          through an image element and spelled the tag out to say so. The scanner
          matched the tag inside the prose.
  fix     The comment says "loaded through an image element" now. The false
          positive is gone because the thing that caused it is gone, which is
          better than a suppression that would have to be explained forever.
  status  FIXED
```

### The sixteen suppressions, each with the reason on its own line

| count | rule | where | why the code is right and the check is wrong |
|---|---|---|---|
| 3 | `font-no-fallback` | `tokens.css` @font-face | A `@font-face` descriptor binds a name to a file. It cannot carry a fallback stack: that is what the syntax is. The stacks live on `--font-body` and `--font-mono`, which is the only place a fallback can exist. |
| 6 | `all-caps-body`, `wide-tracking-body` | `prose.css` `h4`, `th`, callout lead-in | All three are labels, set in the same mono eyebrow the rest of the site uses. The check matches them only through the `.prose` ancestor in its body-selector pattern; none of the three is running text. |
| 5 | `measure` | five headings | `.claim__title`, `.problem__title`, `.beat__head` twice and the hero turn, all at `--text-lg` or larger. The 45-75ch window is a **body** measure. Ragging a heading tighter than that is the reason for setting it at all. |
| 1 | `rest-opacity-zero` | `Terminal.astro` | The rule sits under `.is-cycling`, which the component's own script adds. With no JavaScript, and under `prefers-reduced-motion`, every take and every line is visible and finished. The rest state is the opposite of what the check reads. |
| 1 | `rest-opacity-zero` | `InstallBlock.astro` | The first panel ships with `is-current` **in the HTML**, not applied by script. Verified by grepping `dist/index.html`: two occurrences, one per install block. The served page shows the prompt with JavaScript switched off entirely. |

The two `rest-opacity-zero` cases are the ones worth checking again if this component
changes, because the check is asking a real question - *does the first frame read?* -
and the answer only stays yes while the rest state ships visible.

---

## Gate 7: the interface audit found what a screenshot cannot

```
R-G7-01   hit targets below the floor on both surfaces
  found   Eleven links on the home and eight in the docs measured 13px and 23px
          tall against a 24px minimum. Every one was display: inline, so it was
          only as tall as its own text. The static check does not catch this and
          neither does a screenshot: the link looks fine, it is the target around
          it that is not there.
  which   The secondary call to action; the link at the foot of each of the three
          claims in band 6; band 7's "Read the docs / Source" pair; the four
          footer links; and every entry of the docs "on this page" list, which
          came to 23px - one pixel short.
  not     "Maintained by ilien" is left alone. It sits inside a sentence, which is
          the documented exemption, and padding it would break the line box of the
          text flowing around it. Exempt is not the same as overlooked, so it is
          named here.
  fix     --hit-min: 24px in the token layer. In base.css, `p > a:only-child` -
          a paragraph that is nothing but a link is a standalone target, and that
          is a structural test rather than a list of class names to keep in step.
          Rows holding several links are matched by their own selectors, because
          :only-child cannot reach them. The docs list got min-height.
  measure Re-measured in the browser after the fix: home 25 targets, docs 30
          targets, undersized zero on both.
  status  FIXED
```

```
R-G7-02   focus, measured rather than assumed
  assert  One focus treatment, present, never removed without a replacement.
  measure Read back from a focused element in the built page: outline solid,
          width 2px, offset 4px. Present.
  status  PASS
```

---

## Gate 6: the visual loop, scored by someone else

Scored by a separate reviewer given `DIRECTION.md`, the sixteen captures and the
rubric, and explicitly **not** the source. The protocol says the agent that built a
thing is the worst available judge of it, and that a reviewer who can read the code
scores the intention. That was worth the cost: the first run came back **FAIL**,
with eight of eleven criteria below 4, and almost every finding was something the
static check cannot see and I had stopped noticing.

### Run 1 — FAIL

| surface | criterion | score |
|---|---|---|
| Home | Composition | 3 |
| Home | Typography | 4 |
| Home | Colour and contrast | 3 |
| Home | Visual identity | 3 |
| Home | Polish | 2 (capped) |
| Docs | Composition | 3 |
| Docs | Typography | 4 |
| Docs | Colour and contrast | 3 |
| Docs | Visual identity | 3 |
| Docs | Polish | 2 (capped) |
| Docs | Navigability | 4 |

The findings worth keeping, in the reviewer's own terms:

- **The rhythm was metronomic.** In six consecutive bands the eyebrow sat at y=133,
  the heading's first line at y=204 and the content at y=311 — the same three
  numbers every time — and each band closed with the same ~96px of empty ground.
  Asymmetry happened once, in the hero, and never again.
- **Every band left its whole right half empty** above the content and then filled
  it edge to edge.
- **Three of eight bands are bordered card walls**, which the direction's own
  component list names under "Not built: card grid".
- **The docs rail sat 32px off the home's** at the same viewport, so the two
  vertical rules — the single device this idiom rests on — jumped the moment a
  reader clicked DOCS.
- **The signature was missing from the docs pages.** `NN / LABEL` appeared on the
  index and then never again, so the one element that makes the site nameable was
  absent from the twelve pages a reader actually spends time in.
- **The docs index had a broken cell**: the spanning last card laid its text out
  differently from every card above it, aligning with neither column.
- Smaller: the §2 rule stopped at 662px where every other rule ran the full rail;
  the footer orphaned "BY ILIEN." onto a second line; the index card descriptions
  were set two steps below the same role on the home.

### What was fixed, and what was not

```
R-G6-05   the three highest-impact fixes, run 1 -> run 2
  1  ONE RAIL FOR THE WHOLE SITE. --rail-docs is deleted. The docs sit in the
     home's rail and the three columns were narrowed to pay for it; the prose
     measure is capped below the column either way, so only tables lost width and
     tables already scroll in their own box. The `surface` prop on Base.astro
     existed only to swap the rail and is deleted with it rather than left as a
     prop that does nothing.
  2  THE BAND HEADER IS TWO COLUMNS. An asymmetric 5:7 split, heading left, lede
     right, on any band that has a lede. It fills the empty right half and it is
     the one thing the eye can use to tell the bands apart. The bands lost about
     145px each, which is the metronome loosening as a side effect.
  3  THE DOCS CARRY THE SIGNATURE AND THE INDEX DIVIDES EXACTLY. Every docs page
     opens with `NN / GROUP` in the same tracked mono, which is both the signature
     and the breadcrumb the content column loses when the h1 scrolls away. The
     index chooses its column count per group - three columns for a group of
     three, two otherwise - so no slot is ever empty and no card is special.
```

```
R-G6-06   two of the reviewer's ranked fixes were NOT taken, and why
  1  "Stop the client strip." Refused: the author required continuous motion
     explicitly, twice, and it is already recorded as a knowingly-failing
     craft-floor item under R-B1-15. Reversing it here would be me overturning a
     decision through a subagent, which is not what a reviewer is for.
     BUT the reviewer's clipping finding was checked rather than waved away: the
     viewport carries a real mask, a linear-gradient fading to transparent over
     40px at each edge, confirmed from the computed style in the built page. The
     short leftmost mark is an item entering behind that fade, not a hard chop.
  2  "Delete the two accent highlights." Not taken unilaterally: the author asked
     for an accent on the URL and on a keyword, and R-G3-05 as amended permits two
     <mark> highlights per band plus one accent control, so the page is compliant
     with the rule as written. The reviewer's separate point - that the URL
     highlight is physically larger than the copy button 40px from it, so the eye
     lands on a link before the action - is a hierarchy argument rather than a
     rule violation. It is put to the author rather than decided here.
```

### Run 2 — FAIL, and one regression I caused

| surface | criterion | run 1 | run 2 |
|---|---|---|---|
| Home | Composition | 3 | 3 |
| Home | Typography | 4 | 4 |
| Home | Colour and contrast | 3 | 3 |
| Home | Visual identity | 3 | 3 |
| Home | Polish | 2 (capped) | **4** |
| Docs | Composition | 3 | 3 |
| Docs | Typography | 4 | 4 |
| Docs | Colour and contrast | 3 | 3 |
| Docs | Visual identity | 3 | **4** |
| Docs | Polish | 2 (capped) | 3 |
| Docs | Navigability | 4 | **3** |

Four of the five claimed fixes were confirmed from the pictures: the single rail
(measured as one 1120 rail at two window widths), the 5:7 band header, the docs
signature, the exactly-dividing index grid, the full-rail §2 rule and the repaired
footer orphan.

```
R-G6-07   the round-1 clipping finding did not survive re-measurement
  claim   Run 1 reported the leftmost mark of the client strip as clipped: 16px
          against 25-30px for its neighbours, and missing entirely in light.
  test    Rather than argue, the reviewer sampled ink density across the mark's
          own width: 113 then 233 against 602 for the interior marks, and the
          rightmost ramping 163 -> 578 -> 483 -> 389.
  result  That is a gradient, not a chop. The mask is doing its job and it reads
          as a fade. The finding is WITHDRAWN, and Home Polish rose from a capped
          2 to 4 on the strength of it.
  keep    Worth recording because the first reading was wrong and the second was
          a measurement. A reviewer who cannot be shown to be wrong is not a
          reviewer.
```

```
R-G6-08   a fix that cost something else - REGRESSION, mine
  what    Unifying the rail meant narrowing the docs sidebar. At 208px the twelve
          links and four group labels no longer fitted the sticky column, so it
          grew its own scrollbar: four pages - "What it can't do", "How it was
          measured", "What leaves your machine", "Architecture" - and the whole
          EVIDENCE group label went behind a scroll nested inside the page scroll.
          Docs Navigability fell from 4 to 3. In run 1 all twelve were visible at
          once.
  worse   The bar was the operating system's own, arrow buttons and all, sitting
          inside the one surface whose entire thesis is that every separator is a
          drawn 1px rule.
  fix     The rows carry their 24px target as min-height instead of as padding,
          and the group gaps tightened. The list is 510px and fits: measured in
          the built page as scrollHeight === clientHeight, twelve links, four
          labels, the last link inside the visible box. The scrollbar is also
          drawn from the palette now, for the short-window case where it still
          has to appear.
  lesson  A fix that pays for itself out of another criterion is not finished. The
          rail was right and the sidebar was the bill; the bill went unpaid for a
          round because I did not re-measure the thing I had narrowed.
```

```
R-G6-09   the accent hierarchy, settled without reversing the author
  found   Measured rather than asserted: the URL highlight occupied ~10,900px2
          against the copy control's ~9,830. The largest accent object in the
          install block was a link background, and on a persuade page the primary
          action has to own the one colour in the system.
  bind    Both highlights stay. The author asked for an accent on the URL and on a
          keyword, and R-G3-05 permits two marks per band plus one control, so the
          page was already compliant with the rule as written - this was a
          hierarchy fault inside a compliant rule.
  fix     The control grew rather than the highlight shrinking: min-width 88 -> 128.
          Re-measured: hero mark 9,853 against button 13,991; band 8 mark 9,854
          against button 16,721. The action is the largest accent object in both.
  status  FIXED without overturning anything the author asked for.
```

---

## Gate 6 closed at its ceiling, 2026-09-09

Eight rounds, scored each time by a separate reviewer holding `DIRECTION.md`, the
captures and the rubric — and never the source. That separation was the whole value:
almost everything below is something a static check cannot see and I had stopped
noticing.

### Final standing

| surface | criterion | run 1 | final |
|---|---|---|---|
| Home | Composition | 3 | **3** — gated |
| Home | Typography | 4 | **5** |
| Home | Colour and contrast | 3 | **4** |
| Home | Visual identity | 3 | **3** — gated |
| Home | Polish | 2 capped | **4** |
| Docs | Composition | 3 | **4** |
| Docs | Typography | 4 | **4** |
| Docs | Colour and contrast | 3 | **5** |
| Docs | Visual identity | 3 | **4** |
| Docs | Polish | 2 capped | **4** |
| Docs | Navigability | 4 | **5** |

Nine of eleven at 4 or better, four at 5. **The gate does not pass**, and it cannot:
its bar is every criterion at 4 twice running, and the two that remain need a
decision about what three sections *are*.

```
R-G6-10   the gate's ceiling, and what is behind it
  state   Home Composition 3 and Home Visual identity 3, both traced by the reviewer
          to one cause and struck in every round from the third on.
  cause   Seven bordered card grids - home bands 03, 04 and 06, plus four on the
          docs index - against a DIRECTION.md component list that says, in as many
          words, "Not built: card grid". Four consecutive bands read as one shape
          because three of them are the same shape.
  second  Section 2 stands on its declared FALLBACK. The direction named exactly one
          aesthetic risk, an annunciator whose contents are lamps rather than words,
          and what shipped is a competent two-column table. The result is a page with
          no loud moment in eight bands.
  why not fixed  Both are changes to what a section IS, not to how it is spaced or
          coloured. Spending them without the author would be deciding the brief
          through a subagent. They are put to the author together, because they are
          the same kind of decision and the same criterion.
  refused Varying the heading-to-content gap per band to break the uniform openings.
          The reviewer offered it; it was declined and the reviewer then agreed:
          spacing that differs for no stated reason is noise wearing the costume of
          rhythm, and it would have bought a 4 in Composition at the cost of Polish.
          A 3 with a named cause beats a 4 with arbitrary padding.
```

### What the loop actually caught

Every item here was invisible to the static check, which reported clean throughout.

```
R-G6-11   found by looking, fixed, and measured after
  metronome        six bands opening on the same three y values. The band header is
                   an asymmetric 5:7 split now, and a band with no lede gives that
                   width to its heading. Bands lost ~145px each.
  card alignment   six rounds old. ProblemRow and ClaimList already top-aligned;
                   only Flow did not, because its two-row grid shared its slack
                   between the rows. align-content: start. Heading tops 1990/1980/
                   1939 -> 1939/1939/1939, spread 51px -> 0.
  the URL          overflow-wrap: anywhere split the one string this page exists to
                   have copied: ".../ilien-" then "-dev/", and ".../ilie" then
                   "n-dev/". break-word plus a <wbr> after every slash. <wbr> has no
                   text, so the copy button still yields the exact URL.
  accent weight    the URL highlight measured ~10,900px2 against the copy control's
                   ~9,830, so the largest accent object in the block was a link. The
                   control grew to 128 wide rather than the highlight shrinking -
                   both highlights were asked for. Now 13,991 and 16,721 against
                   9,853.
  empty panel      the terminal wiped every line and settled on an empty box, once
                   per cycle, in the best position on the page. The first line is
                   held through the wipe. Sampled every 60ms for 18s: minimum lines
                   visible 0 -> 1.
  ToC as a wall    one grey, one size, depth by indent alone, and no marker for where
                   the reader was. Two tiers by colour, a current-section marker
                   reusing the sidebar's own device, and a scroll-spy. The dark tier
                   step was 21 levels against light's 48; a token scoped to nav
                   labels, measured against the UI floor of Lc 60 rather than the
                   body floor of 75, brings it to 46 at Lc 66.2.
  no search hint   a `/` badge that shows the shortcut and a key that honours it,
                   ignored while the reader is typing anywhere else.
  the footer dot   line 1 ended on a lone "·". Binding the separator to the link
                   after it moved the fault rather than removing it - line 2 then
                   OPENED on the dot. There is no third side to bind a glyph to, so
                   the glyphs are gone: the row is a flex row with a gap, which is
                   what this idiom uses everywhere else. One line, zero separators.
  a grey scrollbar a column head held on one line pushed a table a few pixels past
                   its box and bought a full-width bar in operating-system grey, on
                   a surface whose palette has no grey. Heads wrap now. 12 tables,
                   0 overflowing.
```

### Three of my own claims were wrong, and one of the reviewer's method

```
R-G6-12   corrections, both directions
  mine    "the docs rail has no right rule / the ToC overflows to the window edge" -
          that was MY CAMERA. The captures were 1159px wide showing a 1280px page,
          so the harness cut off the 121px where the right rule lives. Measured at a
          true 1280: rail x=72->1192 with its border, furthest ToC ink x=1176,
          scrollWidth === clientWidth on every entry. It cost the reviewer two
          criteria and three rounds before I found it. The harness now renders at
          1280 and scales the whole frame to fit the window.
  mine    "an accent focus ring would break R-G3-05." It would not. DIRECTION.md
          assigns --color-focus the accent in dark and reserves the 2px border
          weight for the ring alone, and the tokens already ship that. R-G3-05 is
          amended below rather than left as a rule the build correctly contradicts.
  mine    "the sidebar is unchanged" - it was not. The search field had vanished,
          and the cause was that `astro build` wipes dist WITHOUT running pagefind;
          only `npm run build` does. The site was right and my build command was
          wrong. check-links.mjs now fails if the index is absent.
  theirs  "the client strip clips its leftmost mark." Re-measured by sampling ink
          density across the mark: 113 then 233 against 602 for the interior ones.
          A gradient, not a chop - the mask works. Withdrawn, and Home Polish rose
          from a capped 2 to 4 on it.
  theirs  "the accent does nothing across half the site." Withdrawn on the second
          reading: a docs page at rest has no call to action and no key phrase, so
          there is nothing for the accent to mean, and putting it on a nav marker
          would be decoration - the exact reflex the direction exists to prevent.
```

```
R-G3-05   AMENDED at gate 6 - the focus ring is a third role
  was     "The accent appears only as a solid fill, never as a tint, a border, or
          text. Permitted in exactly two roles: the call to action, and a <mark>."
  now     A third role is named: THE FOCUS RING. In the dark theme --color-focus is
          the accent, at the 2px border weight reserved for the ring and nothing
          else. This is a border, and it is the one border the accent may draw.
  why     A focus ring is a STATE, not a resting colour: it exists only while a
          keyboard user is on the element, it must be the most visible thing on the
          screen at that moment, and it puts no accent on the page at rest. The old
          wording banned it, DIRECTION.md specified it, and the build followed the
          direction. A ledger that disagrees with the build is worse than one with
          three roles in it.
  bounds  Still never a tint, never text, never a decorative border. The ring is the
          only border, and only at --border-focus.
```

The reviewer's closing note, kept because it is the honest summary: *nine of eleven
at 4 or better; the two that remain need a decision about what three sections are,
which is not a thing more rounds of styling can reach.*

---

## Gate 6 PASSES, rounds 9 and 10

Two consecutive runs with every criterion at 4 or higher. Ten rounds, all scored by
a separate reviewer holding `DIRECTION.md`, the captures and the rubric, never the
source.

| surface | criterion | run 1 | final |
|---|---|---|---|
| Home | Composition | 3 | **4** |
| Home | Typography | 4 | **5** |
| Home | Colour and contrast | 3 | **4** |
| Home | Visual identity | 3 | **4** |
| Home | Polish | 2 capped | **4** |
| Docs | Composition | 3 | **4** |
| Docs | Typography | 4 | **4** |
| Docs | Colour and contrast | 3 | **5** |
| Docs | Visual identity | 3 | **5** |
| Docs | Polish | 2 capped | **4** |
| Docs | Navigability | 4 | **5** |

### What turned it, and the mistake that delayed it six rounds

```
R-G6-13   the gate that was not a gate
  what    From round 3 the reviewer struck the same two things every time: seven
          bordered card grids, and section 2 standing on its declared fallback.
  error   I filed both as "the author's decision" and refused to spend them, on
          the reasoning that they change what a section IS rather than how it
          looks. I said so in six consecutive rounds and put them to the author.
  wrong   They were never the author's to decide. DIRECTION.md's component list
          says "Not built: card grid" in as many words, and D7 names the
          annunciator as the intended component with the two-column table as its
          FALLBACK. The author approved that direction at gate 3. The build was
          not honouring a decision; it was VIOLATING one. Fixing it is compliance.
  cost    Six rounds of scoring spent on a ceiling that was never there, and two
          criteria held at 3 the whole time. The reviewer struck it seven times
          without questioning the framing either; neither of us tested whether
          the gate was real.
  lesson  "This needs the author" is a claim, and a claim gets checked against the
          ledger like any other. A rule the author already approved does not need
          approving again to be obeyed.
```

```
R-G6-14   what changed in round 9
  card grids  All seven gone. Every multi-item block on the site is now a ruled
              row list: one column, rows sharing 1px seams, label in a left
              column and reading in a right one. Bands 03, 04 and 06 on the home;
              all four groups on the docs index, which as a side effect can no
              longer leave an empty slot at any item count.
  the panels  The Panel and Lamp components were built to spec from the start.
              What made section 2 read as "an ordinary two-column table with
              dots" was that 10px bulbs under 12px legends are not lamps. 16px,
              legends a step up, rows with real height, lit-filled against
              unlit-hollow-plus-struck: form before colour, twice.
  round 10    The two panels were still sharing one border with a rule down the
              middle - a cell-grid instinct, and the wrong one here. D7 asked for
              TWO annunciators, and two instruments are two objects. They sit
              apart with ground between them now. Measured: filled runs at
              x=114-620 and x=645-1151 with page ground in the 25px between.
```

```
R-G6-15   two defects found while doing it
  the <li> cap   base.css caps every <li> at the reading measure, and these rows
                 ARE list items. Under the old N-up grids each column sat below
                 the cap so nothing showed; across the full rail the cap held
                 every row at 653px inside a 1036px track and the container's
                 hairline background showed through as a grey block down three
                 bands. The measure still applies to the text inside; it must not
                 apply to the row that carries it.
  the URL again  <wbr> OFFERS a break; it does not forbid the others. In the
                 hero's narrower cell the browser preferred the hyphen inside
                 "ilien-dev" because it filled the line better, so the same
                 string broke two different ways on one page - correctly in band
                 8, mid-token in the hero. Each run between two slashes is
                 white-space: nowrap now, which leaves the <wbr>s as the only
                 breaks available. Both blocks agree.
  and worse      The first attempt at that fix put each segment on its own SOURCE
                 line. Inside a <pre> those newlines are content: the URL
                 rendered as eight indented lines and the copy button stopped
                 yielding a URL at all. Caught by asserting the built page
                 contains the literal string - no screenshot would have shown it,
                 because the thing that broke was what the button copies.
```

### Three of my claims were wrong, and are recorded as wrong

- **"The docs rail has no right rule; the ToC overflows to the window edge."** My
  camera. The captures were 1159px wide showing a 1280px page, so the harness cut
  the 121px where the rule lives. Measured at a true 1280: rail x=72→1192 with its
  border, furthest ToC ink x=1176, `scrollWidth === clientWidth` throughout. It
  cost the reviewer two criteria and three rounds.
- **"An accent focus ring would break R-G3-05."** It would not. DIRECTION.md
  assigns the accent to `--color-focus` in dark and reserves the 2px border weight
  for the ring alone. R-G3-05 is amended to name the ring as a third role.
- **"The sidebar is unchanged."** The search field had vanished, because
  `astro build` wipes dist WITHOUT running pagefind and only `npm run build` does.
  The site was right and my build command was wrong. `check-links.mjs` now fails
  when the index is absent.

And two of the reviewer's, withdrawn on re-measurement: the strip's "clipping" was
a working mask, and "the accent does nothing across half the site" was a worse
reading of the direction than the one that withheld it.

### Named, real, and not fixed

None of these changes the verdict; all three sit inside criteria already at 4. They
are written down so the next session finds them as decisions rather than as
oversights.

1. **Bands 04 and 06 are structural twins.** The reviewer supplied the reason a
   difference would need, and it is a good one: band 04's rows each say TWO things
   — a fault and its answer — where band 06's say one, and that pairing is
   currently carried by the word `INSTEAD` doing a seam's job. An internal
   horizontal seam would make the row visibly what it already is. Not taken in
   this session only because the gate had just passed on a stable build and the
   two-consecutive-runs rule is measured on one.
2. **The band foot is uniform** where the band head now varies: every band reserves
   roughly the same trailing space regardless of what it ends on.
3. **Three docs table heads break mid-token** — "HELD-" / "OUT RECALL" and its two
   neighbours — the trade taken in round 8 when the alternative was a grey
   scrollbar under one table and not its neighbour.
```
R-B1-15   STILL FAILING, and still the author's
  The client strip autoplays with no visible control, no pause on hover and no
  focus stop, at the author's explicit direction given twice. prefers-reduced-
  motion still halts it outright. The reviewer struck it in all ten rounds and it
  is the last remaining Home Identity deduction. It is the one item in this whole
  ledger that cannot be fixed by obeying the direction, because obeying the
  author and obeying the craft floor point opposite ways here.
```
