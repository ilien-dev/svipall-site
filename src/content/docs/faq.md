---
title: Questions
summary: The short answers, including the ones where the honest answer is "sometimes" or "that has not been established".
group: Start here
order: 19
source: docs/faq.md
---

## Do I need an API key, an account, or a subscription?

No third-party account, API key or subscription is required by Svipall itself. The
destination site may require authorisation of its own.

Browser provisioning can happen automatically when enabled; blocklists, a configured
DNS resolver, page resources and browser background traffic can also contact remote
servers. The [privacy page](/docs/privacy) lists all of it.

## Which platforms does it run on?

Windows, macOS and Linux. CI runs the shared checks on all three, and tagged
releases attach binaries for **Windows x86-64, macOS Intel, macOS Apple silicon,
Linux x86-64 and Linux arm64**, with a `sha256sums.txt` and a build attestation.

| Platform | Published binary | Browser provisioning | Model-enabled binary |
|---|---|---|---|
| Windows x86-64 | yes | managed download or detected compatible browser | yes |
| macOS Apple silicon | yes | managed download or installed browser | yes |
| macOS Intel | yes | managed download or installed browser | no |
| Linux x86-64 | yes | managed download or installed browser | no |
| Linux arm64 | yes | operator-installed Chromium via `browser_path` | no |
| Windows arm64 | no native target in the release matrix | x64 emulation was not validated in this audit | no |

> **A package existing is not the same as it working**
> Browser operation also depends on an installed compatible browser, OS libraries,
> and a usable display for headful tiers.

The workflow omits ONNX models from Linux and Intel-Mac binaries to accommodate the
runtime distributions it uses. The full Linux container supplies its own libraries
and uses Debian's Chromium on arm64.

**A binary without models can still attempt non-model strategies.** Proof-of-work,
slider, rotation, drag and hold strategies need no ONNX weights. Token widgets may
clear in the browser, or may demand further challenges. Model-dependent paths need
compatible models or usable human assistance, and neither path guarantees
acceptance. `svipall doctor` reports whichever limitation applies to your machine.

## Can I use it without an AI agent?

Yes, two ways.

Completed `svipall` data commands print one JSON object, so `| jq` works — help goes
to stderr, and `serve` is a long-running server. And `svipall serve` puts nineteen of
the twenty-nine MCP tools behind a local REST API that any language can drive.

MCP is one front end of three, not the product.

## Will it get my IP blocked?

It can, and the tool is built around that being the scarce resource.

Top-level attempts are paced per domain and exit, a persistent visit window limits
bursts, full `Retry-After` backoff is kept, a hard block puts the domain on a
15-minute cooldown, and a reputation ledger tracks what each address has spent with
each host and decays it with a six-hour half-life. Two crawls of the same site
cannot run at once, for exactly this reason.

> **None of that makes you invisible**
> This project's own benchmark watched a home address get worse at three targets
> over a day of runs, and published it.

## Does my data leave my machine?

Svipall stores its cache, crawl state, cookies, profiles and captcha corpus locally
under `~/.svipall` (or `SVIPALL_HOME`).

Web requests still reach remote sites, including credentials or form input you
submit, and results go to your connected agent or client. Native fallback can expose
real browser and device characteristics. There is no Svipall telemetry and no cloud
sync. The [privacy page](/docs/privacy) has the detail.

## Will it get past Cloudflare, DataDome, Akamai, PerimeterX?

Sometimes. The [proof page](/docs/proof) says which historical configurations passed
and how often, with the raw logs committed.

On `public31`, Turnstile cleared on the `real` tier at nowsecure-cf in 2.7, 1.7 and
1.7 seconds, and did **not** clear at canadianinsider, which stayed gated on `http`
in all three runs. Other outcomes varied across visits.

The recorded DataDome browser visits returned a blocked-visitor interstitial, while
bare HTTP on the same address received a different challenge. Those observations do
not isolate the cause to the IP address.

`web_route` can try an exit you supply, without guaranteeing acceptance.

## Is it a Firecrawl / Crawl4AI / Scrapling / Playwright MCP replacement?

There is overlapping functionality, but this repository has **not** established a
current head-to-head winner, and does not claim one.

Svipall focuses on local operation, content labels, bounded routing and local
challenge attempts. Compatibility, completeness and success still need validation on
your own workload.

## Is scraping legal?

That depends on the site, the data and where you are, and it is your call rather
than this project's.

> **No authorisation is granted**
> Svipall gives you none with respect to any system you point it at. Read
> `DISCLAIMER.md` before running it against something that is not yours.

It evades bot detection on public pages. It does not crack passwords, bypass
paywalls or forge authentication.

## Do I need a GPU?

No. The supplied CPU model paths need none. Availability depends on the build and
the installed weights.

Browser software rendering can affect fingerprint consistency; `web_status` reports
detected limitations, without proving how a site will classify them.

## Why Rust?

Native executables, low parsing cost in the measured fixture, and BoringSSL linked
directly for browser-like TLS handshakes.

Windows packages carry the required Visual C++ runtime DLLs beside the executables.
No Node or Python runtime is needed to run them.

## How do I say it?

*SVEE-pahl.*
