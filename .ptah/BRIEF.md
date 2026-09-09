# Brief: Svipall — home (persuade surface)

Produced by the Ptah interview. Every entry below came from an answer that
passed its rubric, or is marked NOT YET.

Written in English, whatever language the interview was conducted in.
Interview conducted in Spanish. Session: 2026-09-09.

---

## A. Subject

**A1 What it is**
Svipall is a local Rust binary that hands an agent the page, or the exact verdict of the
wall that refused it.

Mechanism behind the sentence: `wall_kind`, `wall_vendor`, `wall_evidence`,
`blocked_reason`, `note`.

**A2 Product type**
Open-source MCP server, shipped as a single Rust binary that also exposes a CLI and a
local REST API. When the three conflict, MCP wins: the page is organised around
installing it into an agent, not around shell commands.

**A3 Audience** — revised at gate 2, after the author replayed the brief.

Decides: **a non-technical but heavy user of AI agents.** They live in Claude Code, Cursor
or opencode every day, they ask those agents to read the web constantly, and they do not
read code. They have felt the failure without being able to name it: the answer was
confidently wrong, or thin, or clearly about the wrong page.
Uses day to day: the agent itself, which picks the tool without being asked. The human never
sees a tool call and must never be shown one on the home.
Currently uses instead: the client's own built-in WebFetch / WebSearch.

Secondary, and reached only at section 7 and the footer: the developer who opens a terminal
and wants the CLI, the REST API and the source. Also secondary: the corpus / dataset / RAG
builder. Neither gets a hero, a CTA or a section of their own.

**A3b Primary resolved**
The non-technical agent user is primary and owns sections 1–6. The technical reader is
served at section 7 in one block, because an AGPL project whose home never admits it is code
loses credibility with the one reader most able to verify it.

Direct consequence, and the hardest rule in this brief to hold: **sections 1 to 6 contain no
jargon.** Not "tier", not "MCP server", not "JSON", not "Markdown" without a plain gloss,
not a field name, not a status code.

**A4 Promise**
Svipall gives local web access to the developer working inside an AI agent, so that the
agent stops handing back an anti-bot wall as if it were the requested content.
Gain type: avoided failure. Evidence: the verdict fields listed in A1.

**A5 The single job of this page**
The visitor copies one line, pastes it into Claude Code / Cursor / opencode, and the
agent installs and registers Svipall itself.
Destination, confirmed to exist: `docs/install.md`, which walks an agent through platform
detection, installation, verification and MCP registration.
Secondary path: `/plugin marketplace add ilien-dev/svipall` for Claude Code.

**A6 Closest alternative and the real difference**
Alternative: Firecrawl.
Difference — a different tradeoff, not a feature list. Firecrawl runs the infrastructure
and charges per page; the target URLs pass through their systems. Svipall runs on the
machine the user already has; there are no credits and no third party, and the cost moved
rather than vanished: it is now the user's CPU, the user's IP address and the user's
standing with the target site.

---

## B. Truth ledger

Confirmed to exist, verified 2026-09-09:

| Asset | Value or URL | How verified |
|-------|--------------|--------------|
| Public repository | https://github.com/ilien-dev/svipall — AGPL-3.0, Rust, created 2026-09-03 | GitHub API, 2026-09-09 |
| Published npm package | `svipall@1.0.0-rc`, published 2026-09-06 by `ilien` | registry.npmjs.org, 2026-09-09 |
| Maintainer identity | `ilien` / `ilien-dev`, code@ilien.dev | npm + GitHub owner record |
| Recorded run demo | `docs/demo/svipall.gif` — six commands and the output they printed, replayed from real runs on one machine, raw captures in `docs/demo/raw/` | in repo |
| Extraction measurements | `docs/extraction.md`: ROUGE-LSum F1 median over 3,975 gradable SIGIR-23 pages; boilerplate removal worth +0.19 F1; WCXB 0.806 dev / 0.870 held-out; required-snippet recall 86.3% dev (1,476 pages) / 93.3% held-out (505 pages); per-language F1 English 0.827, Greek 0.789, Polish 0.746, Russian 0.624, Chinese 0.608 | in repo |
| Committed benchmark logs | `bench/` raw run records, `docs/proof.md` pairing every published number with the command and log that reproduce it, failures included | in repo |
| Published limits | `docs/limits.md`, `DISCLAIMER.md` | in repo |
| Human captcha dashboard | `http://localhost:8787/human` — real, but only after install | in repo |
| Labels on what came back | `docs/features.md`: an **integrity verdict** (`full` / `partial` / `thin`), a **substance classifier** you train yourself (`junk` / `thin` / `ordinary` / `substantive`), near-duplicate observations, and `corroboration` on multi-page fetches | in repo, verified 2026-09-09 |

**Stated limits that travel with the row above, and may not be dropped when it is used:**

- Percentiles come from this machine's own history and **are not returned below 30
  observations**; `docs/features.md` says in as many words that they are not validated
  confidence intervals nor a representative sample of the web
- Provenance is **observations, never a score**
- **Quality labels do not discard pages.** Svipall labels what arrived; it does not filter,
  rank by trustworthiness, or decide what is worth reading
- Classification of blocks is heuristic, and a clear verdict still needs a content check

The plain-language form permitted on the home is therefore: *"it tells you whether the page
arrived whole, whether it is substance or filler, and whether you have already seen it."*
The phrase **"confidence index"**, and any wording implying a trust score or automatic
filtering, is forbidden: it was proposed at gate 2 and does not match what the product does.

**Forbidden on this page** (does not exist, so does not appear, and no section depends on
it):

- Testimonials, pull quotes, avatars, any attributed praise
- Client or user logo wall
- User, customer or install counts
- GitHub star count or download count as social proof. The repo stands at 0 stars, 0
  forks, 0 watchers as of 2026-09-09; the repo is linked, the counter is not shown
- Security or compliance badges (SOC 2, ISO 27001 and equivalents)
- Team or about page, org chart, headshots. The maintainer handle `ilien` is the only
  identity claim permitted
- Physical address or legal entity
- Pricing, plans, "free tier", commercial licence or support tiers
- A live in-browser demo or playground. Recorded NOT YET; out of scope for this build
- The 160/160 automation-tell probe result — deliberately declined by the author at B1
- The historical `public31` numbers (93 cells / 59 / 44) — deliberately declined at B1

---

## C. Scope

**C1 Architecture**
One persuade home plus a multi-page docs section with a persistent sidebar, one page per
topic. Rejected: a single long docs page (twenty source documents make it unusable) and
generating docs from the product repo (deferred — see the NOT YET table).

**C2 Sections, in order** (home) — revised at gate 2

1. **Hero.** The turn — one sentence that names the reader's own experience — plus the
   copyable install block, inside the first screen.
2. **Before and after.** What your agent gets today, and what it gets with Svipall.
   ← the one aesthetic risk (D7), built as two facing annunciator panels.
3. **What you ask → what it does → what it hands back.** The flow in three beats.
4. **The four problems, in plain words.** The wall it never told you about; the wall of raw
   page it dumps into the answer; filler nobody labelled; searching without an account.
5. **Things you can ask for**, phrased the way the reader would actually say them.
6. **Why you can believe it.** It runs on your machine; nothing is claimed that is not
   measured and published, failures included → `/docs/proof`.
7. **If you open a terminal.** The CLI, the local API, and that it is open source under
   AGPL-3.0. The one place the technical reader is addressed.
8. **Final CTA**, licence, disclaimer.

Eight sections. No section depends on evidence that does not exist. Sections 1–6 carry no
jargon (see A3b).

Rejected at gate 2: the nine-section version organised around the tier ladder, the 29 tools
and a measurement table. It described the mechanism to a reader who was never asking how it
works.

**C3 Docs strategy**
Same codebase, same design system: Astro content collections, a docs layout written for
this project, and Pagefind for search — a static index built from the compiled HTML, no
server. Chosen so every value in the docs resolves to the same tokens as the home and the
parity loop can verify both. Starlight was rejected: its own structure and density would
survive a token override, and the verifier would report its literals as magic values.

**C4 Additional pages** (twelve, each with a distinct job)

| Page | Job |
|---|---|
| `/docs/install` | Every client and OS, what ships where, building from source |
| `/docs/mcp-tools` | The 29 tools, parameter by parameter |
| `/docs/cli` | Commands and their flags |
| `/docs/rest` | The 19 routes, the job routes, what each status code means |
| `/docs/configuration` | Every key in `~/.svipall` and what changing it costs |
| `/docs/captcha` | Fifteen widget families, eleven answer modalities, and what happens when none work |
| `/docs/extraction` | How a page becomes Markdown, and how well, against three corpora |
| `/docs/proof` | Every published number with the command and log that reproduce it |
| `/docs/limits` | What it does not do, stated on purpose |
| `/docs/privacy` | What leaves the machine and what does not |
| `/docs/architecture` | The nine crates and why they are separate |
| `/docs/faq` | Short answers to the questions the README keeps getting |

Engineering notes (firefox, http3, bench, development, models, exits) link to the repo
rather than existing here at half strength.

**C5 CTAs**
Primary: a copyable block that installs Svipall into the reader's agent, pointing at
`docs/install.md`. Secondary, lighter: "How it was measured" → `/docs/proof`, because the
reader who hesitates wants the log, not more argument. `Docs` and `GitHub` live in the nav
with no CTA weight.

**C6 Languages**
English only. The repo, the README, the twenty documents, the binary's own output and every
tool name are already English; a Spanish home linking to English docs breaks continuity at
the exact moment the reader needs it.

---

## D. Art direction inputs

**D1 It is:** forensic, instrumented, stubborn.
Forensic because it names the evidence of the wall. Instrumented because everything it does
is logged and measured. Stubborn because it climbs six tiers before giving up.

**D2 It is never:** Norse-epic, magical, hacker-cliché.

- *Norse-epic* forbids runes, knotwork backgrounds, horns, ravens, gold and parchment, saga
  lettering, "the god of…", Valhalla. The name comes from Grímnismál; the page must not.
- *Magical* forbids sparkles, wands, violet AI gradients, "it just works", anthropomorphising
  the agent.
- *Hacker-cliché* forbids phosphor green on black, glitch, skulls, anonymous hoods, code
  rain, scanlines.

**D3 References** — all seven verified by screenshot on 2026-09-09, not from memory. Two of
the sentences below are corrections of what was remembered wrongly.

| Reference | Axis | What is taken |
|---|---|---|
| HydraDB | structure & navigation | A 1px hairline grid that cuts the page into cells: each block declares its own edge instead of floating on a ground. Explicit numbering (`01 02 03`) in the eyebrows. |
| HydraDB | surface & material | Black ground bled to the edges, radius 0, and the accent used as a **solid fill behind text** rather than as a 10% tint. |
| Cloudflare Radar | surface & material | Correction: it is a light interface, not a dark one. What holds is that the chrome is achromatic and the saturated hue lives **only inside data**; the unit of display is a large tabular figure under a small label. |
| Klim / Söhne specimen | type & composition | Black ground; one saturated red used **exclusively** on the single commercial action, everything else achromatic. The range between the enormous display and the tiny nav *is* the composition. |
| Stripe API docs | structure & navigation | Persistent left rail, and a right-hand panel holding the artefacts (BASE URL, client libraries) that stays put while the prose scrolls. Also taken: "Copy for LLM" and "View as Markdown" — docs that assume the reader may be an agent. |
| Pagefind | controls & state | The search field advertises its shortcut (`Ctrl K`) inside the field itself; the sidebar groups pages under small-caps category labels and marks the current page with a rule, not a fill. |
| Ghostty | motion & response | The product's own output **is** the hero image. No illustration, no decorative motion at all, two buttons of equal weight, one sentence. Zed.dev was the original pick and failed to load (transport error, status 0); it was replaced rather than retried. |

All five axes are covered. SQLite.org was proposed and cut by the author.

**D4 Reference from outside software**
An aircraft annunciator panel. Each lamp names a specific fault; two urgency levels
distinguished by colour rather than size; an unlit lamp stays legible, so the "all clear"
state is designed too; nothing blinks except what demands action.

**D5 Existing brand assets**
Partial. The mark (hooded figure, one eye, knotwork beard), the lockup and a monoline
wordmark exist as SVG. The mark's four fills are already wired to CSS variables, so it is
retinted rather than replaced.

Decision: **the mark is monochrome, with the accent used only on the eye.**
`--svipall-ink` and `--svipall-rust` both resolve to the ink token, `--svipall-bone` to the
ground, `--svipall-amber` to the accent. The result is a two-value silhouette with a single
saturated point. It survives 24px favicon rendering, where four colours become mud.

The wordmark is a find in its own right: monoline, 15-unit stroke, mitred joins, butt caps
and not one curve — built entirely from straight segments. That is the project's line
language, and the whole system inherits it.

The original palette (`#0B1A2B` ink, `#A7472C` rust, `#EAD9C4` bone, `#DF8D27` amber) is
**refused for the site** by the author: it works on GitHub's white, it does not work as a
web palette, and it reads as the logo's mythology rather than as the product's own identity.

**D6 Theme**
Both. Dark is designed first and served when the system expresses no preference; light is a
complete design, not the dark one inverted. Gate 6 scores both themes.

**D7 Where the one risk goes** — revised at gate 2

Section 2, the before-and-after, built as **two facing annunciator panels** from D4: the
same lamp vocabulary on both sides, one labelled for what the reader's agent gets today and
one for what it gets with Svipall. The off state is designed: an unlit lamp stays legible,
because half the argument is what is missing on the left.

Everything else on the page stays quiet, and the hero stays clean so the CTA wins. The risk
sits at section 2 rather than 4 so that most readers actually reach it.

**Honesty constraint on this section, non-negotiable.** The left panel describes the real
behaviour of a client's built-in fetch, sourced and checkable, never a strawman:

- it issues a plain request and treats a `200` as success, including when the body is a
  challenge page
- it returns the page's markup, and the reader's context pays for all of it
- it applies no label to what came back — complete or truncated, substance or filler,
  the same page it already fetched or a new one

Anything the left panel claims must be as defensible as anything the right panel claims. A
comparison that exaggerates the other side fails this brief exactly as a fabricated
testimonial would.

The tier ladder as six labelled lamps (HTTP, BROWSER, STEALTH, REAL, WARM, NATIVE) was the
gate-1 answer and is rejected at gate 2: those names are background mechanism, and the
revised A3 reader is not asking how it works. The ladder survives on the home only as a
plain phrase — "it tries six ways" — and in full at `/docs`.

**D8 Tone of voice**
Second person, plain. Speaks to the developer directly, describes what already happened to
them, and never decorates. No exclamation marks. Sample, rewriting A4:

> Your agent read a "checking your browser" screen and summarised it as the article. It was
> a 200, so nothing flagged it. Svipall tells it what actually happened, then tries five
> more ways.

The docs inherit the report register instead: declarative, no second person, hedges kept.

---

## E. Foundations

| Decision | Value |
|----------|-------|
| Density | Two settings, one system. `--density: comfortable` on the home (~68ch measure, 96–128px sections, 17px body); `compact` in docs (~72ch, 40–64px blocks, 15px body, 14px tables). The docs measure was proposed at ~78ch in the interview and corrected down: 45–75ch is craft floor and is not licensable. |
| Type scale | Fluid, eight steps, `clamp()` between 390px and 1440px viewport: 11→12, 13→14, 15→17, 18→21, 22→27, 28→36, 36→52, 46→76. Adjacent ratios at the top end 1.17 to 1.46. |
| Spacing scale | 4-point, nine steps: 4 8 12 16 24 40 64 96 128. |
| Radius scale | `0` default, `2px` for inputs and code chips, `50%` for the status lamp only — a real lamp is round, and it is the only curve on the page. No pill. |
| Elevation | No shadow except one. Separation is a 1px hairline plus a surface-value shift. A single ambient+direct shadow is reserved for the only things that leave the plane: the search dialog and menus. Rule: if it has a shadow, it can be closed. |
| Layer scale | 0 base, 10 raised, 100 sticky, 1000 overlay, 1100 toast. |
| Motion durations | 90ms state, 180ms reveal, 320ms the one orchestrated event. |
| Palette structure | Two axes. One bright accent for brand and action; a separate short semantic set (ok / caution / blocked) that appears only where there is a state to report. The semantic set never decorates. |
| Neutral bias | Toward the accent hue, 3–6% chroma, so ground and accent read as one system rather than two decisions. |
| Typeface pairing | Display and code: **Commit Mono** (SIL OFL 1.1, verified at commitmono.com on 2026-09-09, free for commercial use). Body: **Archivo Variable** (OFL). Both already ship in the product repo at `docs/demo/fonts/`, so the pairing is inherited rather than invented. |
| Motion budget | Designed hover, focus and active states at 90ms, plus exactly one orchestrated moment: the ladder lamps stepping HTTP→BROWSER→…, triggered by a Replay control, never by scroll. The panel renders complete at rest. |
| Accessibility target | WCAG AA and APCA, run separately and reported separately, in both themes. A pair that passes AA and fails APCA is reported as a warning, not a block. |

---

## F. Stack

| Decision | Value | Warning accepted |
|----------|-------|------------------|
| Framework | Astro. Content collections for twelve docs pages, zero JS by default, one island for the tier panel. | — |
| Styling | Vanilla CSS with custom properties. Chosen so the verifier can grep any literal that fails to resolve to a token. | — |
| Components | None. Hand-built primitives, only the ones gate 3 names. | Kit libraries declined: their defaults are the average this process exists to avoid. |
| Fonts | Self-hosted variable `woff2`. Determined by E5: Commit Mono is not on Google Fonts. Real fallback stacks required on every face. | — |
| Deploy | Cloudflare Pages. Static output, `astro build && pagefind`. | Noted and unused on the page: Cloudflare is one of the wall vendors Svipall classifies. |
| Forms / analytics / CMS | None in scope. F6 not triggered: no form section, and A5 is not a signup. | — |
| Constraints | None named. F7 not triggered. | — |

---

## G. Governance

Trust level: **2 — Builds**. Whole sections written against `DIRECTION.md` and presented one
per turn. Gates 2, 3, 4 and the close of 8 remain human decisions at every level.

Safeguards before publish: token linter, accessibility pass, interface audit, visual scoring
loop, and the parity loop, which is not optional.

Reviewer before publish: the author alone. The parity report must therefore be
self-explanatory — there is no second reader to fill gaps.

---

## H. Text

humanizer: **will run**. Detected at `~/.agents/skills/humanizer` and in the plugin cache.
Copy language: English.
First draft by: the agent, section by section, from the README, the docs and the benchmark
records; the author approves or corrects before a word reaches the code.

---

## Gaps recorded as NOT YET

| Question | Gap | Scope constraint it created |
|----------|-----|------------------------------|
| B1 | No live browser demo exists | No section promises trying it without installing. A playground is a future build. |
| B1 | No social proof of any kind exists | Proof is carried entirely by reproducible measurement, with its failures shown. |
| B1 | GitHub stars, forks and watchers all stand at 0 | The repo is linked; no counter is rendered. |
| C3 | Docs are hand-authored, not generated from the product repo | Accepted risk: the site can drift from the code. Revisit when the docs stabilise. |
| gate 3 | Accent hue and full palette not yet chosen | Recorded at gate 3, before any code. `rules.json` carries no `palette` key until then. |
