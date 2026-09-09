---
title: Architecture
summary: Nine crates, why they are separate, and the three invariants each held by a test rather than by convention.
group: Evidence
order: 42
source: docs/architecture.md
---

Nine crates — seven of our own and two vendored — plus the benchmark workspace
member.

Tracked Rust source, including tests and benchmarks, is about **66,000 lines of our
own plus 48,000 vendored**, as of the audit on 2026-09-06.

## The crates

| Crate | What it is |
|---|---|
| `svipall-core` | Classification, identity and fleet, quality (integrity, optimisation, substance, calibration, provenance, diversity), pdf/document, budget, robots, sitemaps, throttle, capacity, saturation, policy, blocklists, exits, reputation, growth, export, widgets, answers, watches, SQLite cache and crawl state |
| `svipall-extract` | The extraction engine — schema, induction, heal, tables, sanitize, prune, meta, signals. Deliberately **MIT OR Apache-2.0**, and re-exported by `core` |
| `svipall-cdp` | **Vendored** chromiumoxide 0.7.0 (MIT OR Apache-2.0), with automation-residue fixes and browser-scoped worker identity. Upstream patch record in `crates/svipall-cdp/PATCHES.md` |
| `svipall-quic` | **Vendored** quiche 0.24.9 (BSD-2-Clause), patched so its QUIC ClientHello and HTTP/3 SETTINGS are Chrome-shaped, and so it links the BoringSSL the http tier already carries rather than a second copy. All eleven deviations in `crates/svipall-quic/PATCHES.md` |
| `svipall-http` | The http tier. `impersonate` (default) emulates Chrome or Firefox through BoringSSL; `--no-default-features` falls back to reqwest, which `web_status` names under `http_engine` and which refuses outright if the emulating engine was asked for by name; `http3` (opt-in) adds the QUIC engine |
| `svipall-models` | The embedded ONNX weights |
| `svipall-solver` | Captcha job store and HTTP API |
| `svipall-dashboard` | The human panel |
| `svipall` | **The product**: MCP tools, browser pool, strategy loop, the HTTP API (`rest`), the job runner (`jobs`) and the progress sink both report through. Ships `svipall-mcp` (server) and `svipall` (CLI, which is also `svipall serve`) |

## Three invariants

Each of these is enforced by a test, not by convention. That distinction is the
point: a convention is a thing everyone agrees to until someone is in a hurry.

1. **One identity profile** drives TLS, headers, CDP overrides, the stealth script
   and every worker realm — so a Chrome version is never stated in two places.
2. **One DOM parse per response.** You ask via `ParseWants` and read from
   `PageParts`; the benchmark asserts the count is exactly 1.
3. **Quality labels do not discard pages.** Extraction and token budgets can still
   limit returned text, but nothing is thrown away for scoring badly.

## The rest of the record

These live in the product repository. They are the long form of everything on this
site.

| File | What is in it |
|---|---|
| `docs/install.md` | Every way to install it, per platform, written so an AI agent can execute it; the MCP registration for every client; and the failures that actually happen |
| `GET-STARTED.md` | The same thing with nothing assumed, for somebody who has never installed anything from a terminal |
| `docs/bench.md` | Every benchmark mode, the three target lists, and the rule each number is read under |
| `docs/extraction.md` | How a fetched page becomes the text a model reads, how good that is against three published extractors, and how to measure it yourself |
| `docs/exits.md` | Proxy pools: sticky vs round-robin, the health arithmetic, healing, `(domain, exit)` pacing, and the four leaks |
| `docs/models.md` | Which models are embedded, the sidecar contracts, hot-swap, and corpus export |
| `docs/firefox.md` | The Gecko identity that ships, and the measured reason the browser-tier fork is not built |
| `docs/http3.md` | The QUIC engine: why h3 was declined twice on reasons that did not hold, the offline Chrome capture it is measured against, and what is still not Chrome |
| `docs/rest.md` | The HTTP API: routes, status codes, the key and the two checks in front of it, and how a long crawl becomes a job you can follow, stop and resume |
| `bench/baseline/README.md` | The measurement journal: every round, including the ones that improved nothing and the ones where a number went down |
| `CHANGELOG.md` | What 1.0 is, every gate it passes with its number, and what is still open |
