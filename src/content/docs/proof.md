---
title: How it was measured
summary: Every published number with the command that reproduces it, the rule it is read under, and the rounds where a number went down.
group: Evidence
order: 40
source: docs/proof.md
---

This project publishes its own benchmarks and reports the number it gets, not the
number it would like.

Raw run logs and JSON are committed in `bench/baseline/` — including the rounds of
work that improved nothing, and the rounds where a number went *down*.

## The gates

| Gate | Result | Needs network? | Command |
|---|---|---|---|
| Test suite | **1,216 passing**, 0 failing, 22 ignored (2026-09-07) | no | `cargo test --workspace` |
| Identity coherence | **8 / 8** — 7 identities plus a 1,500-machine sweep | no | `bench fingerprint --engine chrome` |
| Network fingerprint | **8 / 8** wire checks against `tls.peet.ws` | yes | `bench fingerprint` |
| CPU budgets | **11 timed budgets + 4 structural checks**, all inside budget | no | `bench micro --assert` |
| Extraction quality | median ROUGE-LSum F1 **0.920** over 3,975 pages | no, once the corpus is fetched | `bench extract --corpus DIR` |
| Historical evasion, independent list | **26 / 31**, range 25..26, **zero hard blocks** | yes | `bench evasion --set public31 --runs 3` |
| Historical evasion, our own hard list | **7 / 12**, range 7..8 | yes | `bench evasion --set hard12 --runs 3` |
| Historical evasion, four named vendors | **3 / 8**, range 2..3 | yes | `bench evasion --set vendors8 --runs 3` |

### The rule those three evasion rows are read under

Median of three runs with its range, targets in a fresh random order each run,
cooldowns cleared first, from **a single residential address with no proxy**.

A change counts as an improvement only when the median leaves the previous range. The
reputation spend is deliberately *not* cleared, and `bench evasion` refuses to start
a list whose address has already spent past the line.

> **These are historical results**
> `public31` was re-taken on 2026-09-05. `hard12` and `vendors8` carry their
> 2026-09-04 and 2026-09-05 figures. **All three predate the current automatic
> policy.**

The latter two were not re-taken in that round because running `public31` spends the
same addresses they score, and taking all three back to back is the exact thing that
produced a round this project already published as a warning.

Running the commands above now measures the current code and effective configuration.
It does not recreate the historical policy.

## Automatic-policy snapshot, 2026-09-06

**459 calls across 48 URLs**: three rounds, three consecutive calls per target slot,
with persistent learning, profiles, cooldowns and reputation, a 60-second timeout,
cache bypass and unattended operation.

**348/459 (75.82%) passed the existing delivery check.**

| Set | Passes / calls | Median passes per round (range) | Successful-call median | Fetch seconds per delivery |
|---|---|---|---|---|
| public31 | 237/279 (84.95%) | 79/93 (79..79) | 1.01 s | 5.94 s |
| hard12 | 72/108 (66.67%) | 25/36 (19..28) | 1.31 s | 13.61 s |
| vendors8 | 39/72 (54.17%) | 13/24 (12..14) | 3.50 s | 11.98 s |

The last column includes time spent on failures, divided by delivery-check passes. The
run took **63.95 minutes including pauses** and retained **66 local deferrals and nine
timeouts**.

Native fallback was recorded on **28 calls**, all with a privacy notice; **15
delivered with native identity**. Those are conditional fallback outcomes, not a
controlled estimate of native's gain over disabling it.

> **A passing delivery check is not proof of complete extraction**
> It requires status 200..399, no reported block, nonempty content and at least one
> expected string where supplied — and `public31` has no expected strings. **156 of
> the 348 passes were explicitly paginated**, and the harness did not follow their
> cursors.

The content audit also identifies title-only catalogue responses, empty-result pages
and login pages. Fetching a detector page does not prove passing its active tests.

The executable was frozen at `dd8a304`. These figures **predate the browser
directory/shutdown fix in `e60e10b`** and are not measurements of that newer build.

This is an observed snapshot on one host and exit. The lists contain mixed page types
and basic controls; their overlapping targets and persistent state are not
independent samples of the web. It establishes neither a causal speedup nor
superiority to another tool, nor future reliability.

## Native versus automatic — the paired baseline

**918 calls**, all **334 distinct content fingerprints** reviewed. The control
requests pages directly through Svipall's native `warm` mode; it is not a separate
stock-browser implementation. Both arms use the same frozen executable, deadlines and
shared traffic/reputation accounting.

| Baseline endpoint | Auto | Native warm |
|---|---|---|
| Mechanical deliveries / 459 calls | 293 | 306 |
| Useful production deliveries / 351 production calls | 142 | 140 |
| Useful content available, including responses marked blocked | 144 | 149 |
| Total fetch time, including failures and diagnostics | 1,717 s | 2,986 s |

Useful-delivery counts by round were **54/49/39 for auto** and **55/46/39 for
native**.

> **Overlapping ranges do not establish a content winner**
> Shared budgets also mean one arm can leave the next locally deferred. Fast refusals
> must not be mistaken for faster extraction.

### Across three measured versions

| Version | Useful production deliveries auto / native (351 calls each) | Useful content available auto / native | Production seconds per useful result auto / native |
|---|---|---|---|
| Baseline | 142 / 140 | 144 / 149 | 11.43 / 18.41 |
| Candidate 1 | 164 / 161 | 165 / 171 | 16.96 / 18.70 |
| Current candidate 2 | 130 / 129 | 131 / 136 | 8.40 / 16.58 |

**Auto had the better aggregate efficiency; useful delivery was nearly tied.** On the
same 109 pairs where both returned useful content, auto accumulated **368.41 seconds**
against native's **735.33 seconds**, so the difference is not only fast refusals.

Native was slightly faster on that subset in round 3, and retained more useful content
under the secondary blocked-excerpt measure. The one-result primary difference
establishes neither a quality winner nor statistical equivalence. Neither arm
consistently dominates all sites or rounds.

Candidate 1's pause before round 3 was extended to **13.09 hours by a computer
shutdown**. The report separates results before and after that interruption. That
interrupted run does not establish a causal routing benefit.

Candidate 2's run took **72.51 minutes** including planned pauses and a recorded
**152.42-second controller recovery**. No calls were repeated or lost in that
recovery. It was not uninterrupted, and elapsed-time and history effects remain.

### Where the improvement loop stopped

At the documented practical limit of its tested hypotheses and fixed constraints.
Remaining auto losses were 16 local deferrals, one deadline before native, and three
remote query-quota responses.

That does not prove an absolute technical ceiling.

Two isolated extractor expansions recovered more records in three saved documents but
reduced corpus precision. **Both were rejected**, and broader listing omissions
remain.

## Extraction quality, including where it loses

ROUGE-LSum F1, median over the 3,975 gradable pages of the SIGIR-23 gold standard,
against the study's own published extractions:

| | median | mean | IQR |
|---|---|---|---|
| readability | **0.963** | 0.861 | 0.881 – 0.987 |
| trafilatura | **0.958** | 0.877 | 0.870 – 0.986 |
| resiliparse | **0.936** | 0.826 | 0.810 – 0.980 |
| **Svipall** | **0.920** | 0.831 | 0.773 – 0.976 |
| Svipall, boilerplate removal off | 0.732 | 0.696 | 0.551 – 0.887 |

Three published extractors are above Svipall on median. Boilerplate removal adds
about **0.19 median F1** over the disabled variant.

> **F1 measures agreement, not usefulness**
> It does not measure token cost, and it does not guarantee that a particular answer
> survived. The [extraction page](/docs/extraction) has the required-snippet recall
> figures, which are the ones that see that failure.

## Verifying it without contacting the sites again

Raw records, hashes and offline verification steps are published alongside each
experiment, so the reported calculations can be checked without re-running anything
against a live site.
