# Copy: Svipall home

Gate 4. Every line below is approved text or is marked DRAFT. Ships in English (C6).
Register: second person, plain, no exclamation marks (D8).
Sections 1–6 carry no jargon (R-C2-02). Section 7 is where the technical reader is addressed.

The aperture strings this file used to carry were the signature of the Interleaf direction,
which was built and rejected at gate 5. They are removed rather than left as instructions to
build something the component vocabulary no longer contains. The signature is now the
numbered band header, which is structural and needs no per-section copy.

Passed through `humanizer` on 2026-09-09. What it changed is recorded at the foot of this
file.

---

## Metadata

**Title:** Svipall: your agent doesn't read the web. It tries to.
**Description:** Svipall runs on your machine and gives your AI assistant the page, or the
reason it never arrived. No account, no key, nothing sent anywhere else.

---

## 1 · Hero

> ### Your agent doesn't read the web.
> ### It tries to.
>
> Some pages let it in. Others hand it a wall and let it believe that was the article.
> Svipall tells it which one just happened.

**Install block**, the primary CTA, copyable, inside the first screen:

```
Install and configure Svipall by following the instructions here:
https://raw.githubusercontent.com/ilien-dev/svipall/main/docs/install.md
```

Label above the block: `Paste this into your agent`

*Changed at gate 5. It used to name three clients. The compatibility strip beside it now
carries the marks of all six, so naming three in the label was both redundant and a shorter
list than the truth.*
Button: `Copy` → `Copied`
Under the block: `It installs itself and sets itself up. You never open a terminal.`

**Secondary, lighter:** `How it was measured →` → `/docs/proof`

**The demonstration**, beside the turn. Added at gate 5 at the author's request, replacing a
plain-language table, so the first screen shows the product working rather than describing it.

Label: `One request, start to finish` · Control: `Replay`

```
$ svipall fetch example.com/pricing
→ asked the ordinary way                      refused
→ opened a real browser                       refused
→ waited the check out                        opened
+ the page arrived complete
+ substance, not filler
+ you have not read this one before
  your agent gets the reading, not the page
```

Caption, and it may not be dropped:

> An illustration of what happens, written plainly. It is not a recording: the real runs,
> with the command and the log behind every number, are in the docs.

**Why the caption is load-bearing.** The repo's own GIF is labelled "replayed from real runs
on one machine". This is not that, and a terminal frame reads as evidence whether or not it
is one. The caption is what keeps it from being a fabricated capture. The block carries no
figures at all, because any figure here would be invented and R-B2-01 requires every number
to trace to the truth ledger.


---

## 2 · Before and after

> ### The same page, twice.
>
> On the left, what a plain fetch brings back. On the right, the same request through
> Svipall. Both columns describe behaviour that is documented, and both are held to the same
> standard.

**Left panel, `A PLAIN FETCH`**

| Lamp | Legend |
|---|---|
| ○ | asked once |
| ● | a wall came back as a success |
| ● | the whole page, handed over as-is |
| ○ | nothing said whether it arrived complete |
| ○ | nothing said whether you had seen it before |

**Right panel, `WITH SVIPALL`**

| Lamp | Legend |
|---|---|
| ● | asked six ways before giving up |
| ○ | a wall is named, not passed off as the page |
| ○ | the reading, not the page |
| ● | says whether it arrived complete |
| ● | says whether it is substance or filler |

**Under both panels, and it does not move:**

> Some pages still refuse. You will know which ones, and why.

Control: `Replay` steps the lamps once. Both panels render their final state at rest.


---

## 3 · What you ask, what it does, what you get

> ### Three steps, and you only do the first one.

**01 · You ask**

> "Read this page and tell me what it costs."
> You say it the way you would say it to a person. Nothing changes about how you work.

**02 · It goes and gets it**

> A page that opens gets read. A page that refuses gets asked again a different way, up to
> six times. When it still refuses, Svipall stops and says so instead of making something
> up.

**03 · Your assistant gets the reading**

> The reading, not the page: the part a person would have read, without the menus, the
> cookie banner and the footer. With it come three plain facts. Whether it arrived complete.
> Whether it is substance or filler. Whether it is the same thing you already looked at.


---

## 4 · Four things that go wrong

> ### You have had all four of these already.

**The wall it never mentioned**

> A page can refuse and still look like it worked. Your assistant reads the refusal, sums it
> up, and hands you an answer with nothing wrong on the surface. Svipall names the wall
> instead of summarising it, including who put it there when that can be identified.

**The whole page, poured into the answer**

> One page can be tens of thousands of words of things nobody reads: navigation, scripts,
> repeated footers. All of it competes with your actual question. Svipall hands over the
> reading, and can write long results to a file so that a thousand rows never pass through
> the conversation.

**Filler that nobody labelled**

> Not every page that arrives is worth having. Some are a shell, some are cut off halfway,
> some are the same thing you fetched twenty minutes ago. Svipall labels what came back so
> your assistant can tell those apart. It labels and keeps everything. It does not throw
> pages away and it does not rank them by how much it trusts them.

**Looking something up should not need an account**

> No plan, no signup, nothing to register for. Svipall searches three engines and can merge
> what they agree on.


---

## 5 · Things you can ask for

> ### Said the way you would actually say it.

- "Read this page and summarise the pricing."
- "Crawl these docs and write me a file my assistant can read later."
- "Get me every row of that table as a spreadsheet."
- "Watch this listing and tell me when the price moves."
- "Find the three best sources on this and tell me where they disagree."
- "Log me in once, then keep reading the pages behind it."
- "Read this PDF the same way you read a web page."

> Your assistant picks the right one by itself. There are no commands to learn.


---

## 6 · Why you can believe any of this

> ### Three reasons, and none of them is a promise.

**It runs on your machine**

> No account, no key, no service in the middle. The pages you read stay between you and the
> site. Nothing about what you looked at is sent anywhere else, and nothing tracks what you
> use it for.

**Everything claimed here was measured, and the measurements are published**

> Including the ones that came out badly. Three independent collections of pages were used to
> score how well it reads, and the best and worst results are both published. Each number
> carries the command and the log that reproduce it.
>
> `How it was measured →` `/docs/proof`

**What it cannot do is written down too**

> Some sites will refuse it, and no amount of trying changes that. Those situations have
> their own page, kept beside everything else rather than buried.
>
> `What it can't do →` `/docs/limits`


---

## 7 · If you open a terminal

Jargon is allowed from here down. This is the one place the technical reader is addressed.

> ### It is also a command-line tool, a local API, and readable source.
>
> The same binary your assistant talks to answers on the command line, and on a local HTTP
> API when you ask it to: nineteen routes, one per tool, behind a key it generates for you.
> It is written in Rust, ships as a single binary with no runtime to install, and is open
> source under AGPL-3.0.

```bash
svipall fetch https://example.com/article
svipall crawl https://docs.example/ --pages 50 --out pages.csv
svipall search "rust async runtime" --engine all
```

> `Read the docs →` `/docs` · `Source →` `github.com/ilien-dev/svipall`


---

## 8 · Final CTA

> ### One line, and your assistant does the rest.

Install block, repeated exactly as in section 1.

**Footer**

> Svipall is free and open source under AGPL-3.0. The name and the logo are not covered by
> that licence.
>
> It gives you no authorisation over any system you point it at. Complying with the law,
> with data-protection rules and with a site's terms is yours, not the author's.
>
> `Docs` · `Source` · `What it can't do` · `Privacy` · `Disclaimer`
> Maintained by [ilien](https://github.com/ilien-dev).

---

## Claims register

Every factual claim above, traced. R-B2-01 and R-B2-02 are verified against this table.

| Claim | Section | Source |
|---|---|---|
| A refused page can return a success | 2, 4 | README: "A blocked page is a 200: the call ran, the page did not" |
| Six ways of asking | 2, 3 | README request ladder: http, browser, stealth, real, warm, native |
| A wall is named, with kind and vendor where identifiable | 2, 4 | `wall_kind`, `wall_vendor`, `wall_evidence`, `blocked_reason` |
| Says whether it arrived complete | 2, 3, 4 | `docs/features.md` integrity verdict: full / partial / thin |
| Says whether it is substance or filler | 2, 3, 4 | `docs/features.md` substance classifier: junk / thin / ordinary / substantive |
| Says whether you have seen it before | 2, 3, 4 | near-duplicate observations; `corroboration` on multi-page fetches |
| It labels, it does not discard or rank by trust | 4 | README: "quality labels do not discard pages"; provenance is observations, never a score |
| Long results can be written to a file | 4 | `out_file` on fetch and crawl |
| Search across three engines, merged by agreement | 4 | `web_search`, `engine="all"`: DuckDuckGo, Bing, Brave |
| No account, no key, no third party, no tracking | 6 | `docs/privacy.md`; README: no telemetry, no third-party API keys |
| Measured against three collections, best and worst published | 6 | `docs/extraction.md`: SIGIR-23, WCXB dev and held-out; per-language F1 from 0.827 down to 0.608, all published |
| Every number has the command and log that reproduce it | 6 | `docs/proof.md` |
| What it cannot do is written down | 6 | `docs/limits.md`, `DISCLAIMER.md` |
| Nineteen local routes, one per tool, behind a generated key | 7 | README REST section |
| One binary, no runtime, AGPL-3.0 | 7, 8 | `Cargo.toml`, `LICENSE`, npm package metadata |
| The name and logo are not under the licence | 8 | README trademark section |
| No authorisation over any system | 8 | `DISCLAIMER.md` |

## Hedges that may not be dropped

- §2 and §4 must keep "Some pages still refuse" in view, unmoved, not in a tooltip.
- §4 must keep "It labels and keeps everything", per R-B1-12.
- Nothing anywhere says or implies a guaranteed result against any named wall vendor.
- No percentile or calibration figure appears on the home at all, which is how R-B1-13 is
  satisfied here rather than by adding a footnote.

## What humanizer changed

| Pattern | Where | Fix |
|---|---|---|
| §14 em dashes | metadata title, §2 intro, §3 beat 03, §7 intro, and four labels | All removed. Colons, commas and full stops instead. |
| §11 repeated sentence openings | §3 beat 02, three sentences opening "If" | Rewritten so the page, not the condition, is the subject. |
| §9 "Not X, the Y" | §3 beat 03, "Not the page — the reading" | Turned into a positive clause with a colon. |
| §32 formulaic saying | §1, "is the difference between the two" | Replaced with what it actually does: "tells it which one just happened". |
| §29 heading restated | §4, "Four things that go wrong, and what happens instead" / "The failures you have already had" | Heading trimmed; the sub-line now adds the second-person claim instead of repeating it. |
| §10 forced group of three | §4, "a key, a plan or a signup" | Cut to two, and the heading now carries the point. |
| §23 filler | §6, "there is no usage tracking of any kind" | "nothing tracks what you use it for". |
| §13 passive voice | §6, "Reading quality was scored against…" | Kept passive deliberately in one clause because the actor is the benchmark, not a person; the surrounding sentences were made active. |
| §8 avoiding *is* | §5, "You don't learn commands, and you don't choose between them" | "There are no commands to learn." |

Two things humanizer flagged that were kept on purpose:

- The three-item enumerations in §3 and §6. Both are real enumerations of three things that
  exist, not rhetorical triads.
- The scope sentence in §2 ("Both columns describe behaviour that is documented"). It reads
  like §34, answering an objection nobody raised, but R-B2-02 requires the comparison to
  state its standard on the page. Kept as a genuine scope statement.

## Status

humanizer: **ran**, 2026-09-09.
Approval: **pending**. No copy reaches the code until this file is approved.
