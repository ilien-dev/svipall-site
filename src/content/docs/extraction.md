---
title: Extraction
summary: How a page becomes Markdown, measured against three corpora, including the number that moved 15.7 points without the extractor changing.
group: Behaviour
order: 31
source: docs/extraction.md
---

## The headline number

ROUGE-LSum F1, median over the 3,975 gradable pages of the SIGIR-23 gold standard,
scored by `svipall-bench extract` against the study's own published extractions:

| | median | mean | IQR |
|---|---|---|---|
| **Svipall** | **0.920** | 0.831 | 0.773 – 0.976 |
| Svipall, with the vote | 0.919 | 0.846 | 0.804 – 0.976 |
| Svipall, pruning off | 0.732 | 0.696 | 0.551 – 0.887 |
| Svipall, plain-text walker | 0.767 | 0.723 | 0.592 – 0.903 |
| readability | 0.963 | 0.861 | 0.881 – 0.987 |
| trafilatura | 0.958 | 0.877 | 0.870 – 0.986 |
| resiliparse | 0.936 | 0.826 | 0.810 – 0.980 |

Two of the three published extractors score higher on this corpus. That is what the
table says, and it is left saying it.

Boilerplate removal is worth **+0.19 F1** over the same markdown with it switched
off. Both median and mean are reported because the study's own §4.4 shows the
per-page distribution is power-shaped, with the mean falling barely inside the
interquartile range — a single statistic misleads either way.

On WCXB, which labels pages by type, Svipall scores **0.806** on the development set
and **0.870** on the held-out set.

### Five languages

DAnIEL, ROUGE-LSum mean, with the share of pages the extractor essentially failed on
— the column the multilingual study leads with:

| | pages | F1 | share under 0.3 |
|---|---|---|---|
| English | 475 | 0.827 | 1% |
| Greek | 273 | 0.789 | 5% |
| Polish | 274 | 0.746 | 10% |
| Russian | 266 | 0.624 | 11% |
| Chinese | 401 | **0.608** | 9% |

Chinese is the floor. It is above the reference study's Trafilatura at 0.555 and
below its Readability at 0.672.

A mean of 0.6 can be an extractor that is mediocre everywhere, or one that is
excellent on two thirds of the pages and useless on the rest. 9% under 0.3 says it is
nearer the first, which is the better of the two.

## The number that matters more

F1 answers "how much of the gold came back". It cannot see the failure that actually
breaks an answer: a page scoring 0.92 that dropped the one sentence carrying it.

Cuconasu et al. (SIGIR 2024) measured that the document which degrades a generated
answer is the high-scoring, on-topic, **answer-free** one. So the metric to move is
whether the sentences a person marked as *required* survived extraction.

WCXB ships them: `with[]` phrases a correct extraction must contain, `without[]`
phrases from the chrome it must not. Written by the corpus author, so they are a
second opinion rather than a restatement of our own scoring.

| | required kept | boilerplate leaked | pages losing content |
|---|---|---|---|
| WCXB dev, 1,476 pages | **86.3%** | 13.1% | 355 |
| WCXB held-out, 505 pages | **93.3%** | 11.3% | 79 |

> **This number moved 15.7 points and the extractor never changed**
> It was first published as 72.7% from an audit nobody re-derived, measured here at
> 70.6%, and is 86.3% once a phrase is compared correctly.

The old comparison normalised whitespace and asked for a substring, which calls a
delivered phrase missing whenever markdown puts emphasis inside it
(`the **eastern** quay`), the page uses a typographic apostrophe where the corpus
wrote a straight one, a `&shy;` splits a word, or a footnote digit is glued to the
last one (`daily2`).

`wcxb::contains_snippet` now compares word sequences and allows the edges to fall
inside a word. A probe against the corpus asserts it never calls lost anything the
old one called kept.

## Where the remaining losses go

910 required phrases still do not survive on the development split. Each is
attributed to the stage that dropped it, by extracting the same page four ways:

| where it went | phrases | can it be fixed here |
|---|---|---|
| not in the HTML at all | 121 | no — the page builds it with JavaScript |
| inside `<script>`, `<noscript>`, `<head>`, `<style>`, `<svg>` | 210 | no — text a reader never sees |
| hidden by `style`, `hidden` or `aria-hidden` | 123 | **no — the rule forbids it** |
| the page truncates itself behind "read more" | part of 110 | no — needs JavaScript |
| lost in markdown rendering | 18 | swept and rejected |
| a density threshold removed it | 60 | swept |
| the region selector or an unreachable pruner clause | 381 | three experiments, all rejected |

The third row is the tool's own invariant: **hidden text never reaches the model**.

It exists because a paragraph parked at `left:-9999px` reads to an agent exactly like
the article does, and that is the whole prompt-injection surface. 123 phrases a human
annotator marked as content sit behind it. Extracting them would raise this number
and break the promise. The promise wins.

## What was tried against the last 441 phrases

Every lever with a number attached was swept, fitted on the development split and
checked once against the held-out one. All four were rejected.

**A class name should not condemn a block that reads like prose.** Exempting blocks
with commas, length and low link density:

| commas / chars / link density | held-out recall | held-out leak | held-out F1 |
|---|---|---|---|
| **no exemption (ships)** | **93.3%** | **11.3%** | **0.870** |
| 4 / 300 / 0.25 | 93.3% | 11.4% | 0.865 |
| 3 / 200 / 0.35 | 93.6% | 11.8% | 0.862 |
| 2 / 120 / 0.50 | 93.8% | 12.6% | 0.859 |

Every setting brings back more boilerplate than content, and F1 falls monotonically
as the rule loosens. Development liked it (+1.0 recall); held-out did not.

**The main-region selector.** Neither alternative recovered a single required phrase:

| region rule | held-out recall | held-out leak | held-out F1 |
|---|---|---|---|
| **first match, share ≥ 1/5 (ships)** | **93.3%** | **11.3%** | **0.870** |
| first match, share ≥ 1/2 | 93.1% | 11.4% | 0.869 |
| largest match, share ≥ 1/5 | 93.3% | 12.1% | 0.869 |

**Stripping markdown tokens before comparing.** Both lose more than they recover:

| stripped as well | dev recall | held-out recall |
|---|---|---|
| **nothing (ships)** | **86.3%** | **93.3%** |
| list markers | 86.2% | 93.0% |
| list markers and `*`/backtick runs | 86.2% | 92.9% |

The reason is in the pattern: `\d+.` at the start of a line eats a year or a price
that begins a paragraph, and those are content.

**The density thresholds had never been fitted against anything.** They are now, and
they are on the frontier — no setting on the grid has both higher recall and no more
leak:

| setting | kept | leak | F1 |
|---|---|---|---|
| **shipping (25 / 0.5 / 0.35)** | **86.3%** | **13.1%** | **0.806** |
| `min_text` 0 | 86.3% | 14.3% | 0.798 |
| `min_text` 60 | 85.6% | 12.0% | 0.805 |
| `max_link_density` 0.35 | 85.8% | 12.7% | 0.805 |
| `max_link_density` 0.65 | 86.4% | 13.5% | 0.806 |
| `min_score` 0.20 | 86.4% | 13.3% | 0.806 |
| `min_score` 0.50 | 85.7% | 12.1% | 0.805 |
| all three loosened | 86.6% | 15.1% | 0.797 |

> **That is the ceiling for this extractor as built**
> What remains is not a setting. It is JavaScript this path does not run, and text
> this tool has promised not to return.

## How it works

One DOM parse per response, asserted by tests and by a perf budget. Everything reads
that one tree and returns node ids; nothing re-parses and nothing rewrites markup.

1. **Selection.** A CSS selector from the caller wins outright. Otherwise the
   semantic selectors in `MAIN_SELECTORS` are tried, and a match is trusted only if
   it carries at least 200 characters and a fifth of the page's text.
2. **Removal.** `extraction::prune` scores every container on link density, text
   density, commas and its class name, and marks what reads as furniture.
3. **Rendering.** `Md` walks the surviving tree once, streaming GFM: headings, lists,
   tables, code fences, links resolved against the page URL. Hidden text never
   reaches the output.

### Forum detection — the one thing that improved the shipping path

A discussion thread is the page type every article extractor destroys, because its
posts live in containers named `comment` and every article extractor is built to
strip those. Svipall had the same defect in its own pruner.

`content::forum` asks one question and answers it from what the page declares about
itself. Measured per signal over all 2,008 WCXB pages:

| signal | precision | recall (dev / test) |
|---|---|---|
| `DiscussionForumPosting` / `SocialMediaPosting` | **1.000** (50 fires, 50 right) | 0.384 / 0.137 |
| `itemtype=".../Comment"` alone | 1.000 dev, **0.792** test | 0.143 / 0.373 |
| structural: repeated siblings with an author and a date | 0.800 / 0.700 | 0.036 / 0.137 |
| `QAPage` / `Question` | 0.625 | — refused |

Only the first drives extraction. Letting the bare `Comment` type through cost
**0.016 F1** on the held-out forums, which is what a signal that is perfect on one
split and 0.792 on the other does.

| | before | after |
|---|---|---|
| forums, dev | 0.556 | **0.567** |
| forums, held-out test | 0.809 | **0.810** |
| every other page type | — | unchanged |

Small — and it is the only change in this work that improved the shipping extractor
at all.

The structural stage is kept because it is the only stage that works on a page which
declares nothing, and by the corpus's own count that is **47% of development forums
and 49% of held-out ones**.

> **A rejected addition, recorded**
> Harvest's ancestor discount list was added to that stage and then removed. On WCXB
> it cost one real forum on the held-out split — structural precision 0.700 → 0.667
> — and removed none of the false positives it was added for.

## Three things that are built, measured, and off

### The vote

Three heuristics read the same page and only what **all of them** condemn is removed:
Readability's `grabArticle` with constants intact, Kohlschütter's shallow-text
decision tree, and the incumbent density pass.

Unanimity is the whole safety argument: a voter that misfires can only cause
boilerplate to be **kept**, never content to be dropped.

| | dev | held-out test |
|---|---|---|
| **shipping**, with the forum detector | **0.806** | **0.870** |
| the vote | 0.778 | 0.826 |
| the vote, with the forum detector | 0.781 | 0.828 |
| the vote, told the true page type (an oracle) | 0.787 | 0.835 |
| the vote, told the type by the router | 0.779 | 0.825 |

It earns its place on the SIGIR-23 hard tail — mean +0.016, first quartile +0.031 —
and loses it on the modern multi-type corpus. So it stays available, measured, and
off.

### The router, retired

Knowing the true page type is worth about **+0.010**, and that is a *ceiling*,
measured with the corpus's own labels rather than a prediction.

The router recovered almost none of it: 0.779 against the vote's 0.778. It named the
type right 52.8% of the time against a 50.3% baseline of always answering "article".

The seven-class model, its 22 structural ratios and its trainer are deleted. The
vocabulary is not: `PageType` and the profile table live on, because the forum
detector resolves to them.

Deleting it also removed a cost nobody was paying for on purpose:
`extraction::shape` was computed on every fetch that had a model installed and read
by nothing else.

### Cross-page template learning

Every extractor compared above sees one page and decides from that page alone.
Svipall has a cache: what this operator actually fetched, across sessions. Alarte and
Silva measured that templates are **40–50% of the data on the web**.

One record per domain: how many of that domain's pages carried each block. A block on
most pages of a site is the site, not the page.

Two rules bound it. Nothing is stripped until sixteen pages of that domain have been
seen, and a strip that would leave under a fifth of the page removes nothing at all.

**And it is off, because TECO says so.** TECO is the only public corpus that ships
each key page with its sibling pages:

| `MIN_BLOCK` | fired on | text saved there | **labelled content removed** |
|---|---|---|---|
| 40 characters | 4 of 11 sites | 7.6% | 12 words, on 3 sites |
| **120 characters** (ships) | 2 of 11 sites | 3.4% | **1 word, on 1 site** |

> **The bar for anything on by default is zero**
> No page may lose a word of human-labelled content the extractor had reached. At no
> threshold does this clear it. Raising the floor until one particular corpus reports
> zero would be fitting to that corpus.
