---
title: Configuration
summary: Every key in ~/.svipall, what the automatic routing actually learns, and what each limit costs you.
group: Behaviour
order: 30
source: docs/configuration.md
---

```bash
svipall config show
svipall config set key=value
svipall config preset local
```

Settings live in `~/.svipall/config.toml`, or `$SVIPALL_HOME/config.toml`. Every field
has a default, so a missing or partial file is fine.

The default identity policy is `auto`: learn useful emulated routes first, with at
most one native browser attempt as a last resort. Existing explicit `emulated` or
`native` settings are preserved; `svipall config preset auto` migrates an existing
installation.

Connected MCP clients can save browser policy through `web_status` with a `configure`
object; running MCP and REST servers apply it on the next request.

## Automatic routing, and what it cannot promise

No per-site setup is required. Automatic fetches learn locally by domain, route
family, exit and browser environment.

- Successful delivery with full content quality and observed latency can **promote**
  an emulated route after two supporting observations.
- Repeated failures **demote** it. Evidence expires after 24 hours.
- Routes that repeatedly fail are skipped for 30 minutes. The strongest allowed
  emulated probe stays available, and a repeatedly failing native fallback is also
  paused.
- Classified fingerprint and hold walls are remembered for 30 minutes, to avoid
  weaker probes when a headful route is permitted. Generic errors and native-only
  walls do not supply that evidence, and a later delivery clears the marker.

> **This is a heuristic**
> It cannot prove the requested information is complete, and it cannot guarantee the
> best route or a successful fetch. Short pages are returned with quality labels and
> do not, by themselves, trigger a native attempt.

### Privacy beats delivery

Even a successful native route stays last. Automatic native fallback is excluded for
named profiles, isolated visits, mobile requests, forced tiers and non-GET requests.
Native and emulated automatic profiles use separate directories and cookie jars.

Detected login walls, subscriptions and missing pages stop escalation. HTTP 429/503
triggers backoff.

> **Quotas written only in page text can escape classification**
> The current audit shows this. Respect an observed restriction even when the tool
> labels the response as delivered.

### What native mode exposes

Real browser and device characteristics, potentially including graphics, hardware
capabilities, screen, language and timezone. Sites can correlate these across visits
and cookie profiles.

Emulation reduces some exposure and guarantees neither anonymity nor IP hiding. The
browser uses tool-managed profiles and its sandbox stays enabled; launch flags no
longer request disabling site isolation, client phishing detection or IPC flooding
protection.

Results report `identity_used`, `native_fallback` and a `privacy_notice` whenever
native fallback was attempted, **even if it failed**.

To prevent all automatic native fallback:

```bash
svipall config set auto_native_fallback=false
```

`browser_identity=emulated` also keeps browser requests emulated. Explicit
`browser_identity=native` is a separate manual override.

## The traffic limits

Defaults permit **12 top-level transport attempts per 60 seconds per domain and
exit**, a minimum **1 second between scheduled attempts**, and **6 attempts per
automatic fetch** within its total timeout.

Exceeding the visit window starts a **15-minute cooldown**. HTTP 429/503 stops
escalation and persists a cooldown of at least 15 minutes, or the full `Retry-After`
when that is longer. Rejected calls do not prolong it. The decaying address budget can
stop work sooner.

The visit ledger is transactional and survives restarts. Changing identity or forcing
a tier does not reset it. Successful cache hits do not consume visits. Returned pages
are preserved when further attempts are refused, with `stopped_reason` and
`cooldown_seconds_left` — wait rather than retrying.

> **The unit is a fetch attempt, not a network request**
> Resource loads, redirects, origin warmup, challenge exchanges, scripts and
> interactive actions generate additional traffic. Local development hosts are
> exempt. This is not a browser firewall or a universal request ceiling.

These limits reduce traffic and exposure. They cannot promise a site will not block
an IP.

## What is in the state directory

| File | What it holds |
|---|---|
| `config.toml` | The settings below |
| `settings.toml` | Validated settings saved by CLI/MCP, overriding `config.toml` |
| `secrets.env` | Credentials referenced by name in supported action calls. Does not redact returned content |
| `domain_tiers.json` | Legacy starting-tier memory for explicit emulated/native policies |
| `automatic_routes.json` | Local route evidence under hashed context keys, expiring after 24 hours |
| `traffic.sqlite3` | Transactional visit windows and cooldowns, shared across modes and processes |
| `pools.json`, `exit_health.json` | Exits per domain, and what each one has done on each |
| `reputation.json` | What each address has spent with each host, decaying with a half-life |
| `svipall.db` | Page cache, crawl frontiers, notes, watches, quality histograms, request log |
| `jobs.db` | Challenges seen, how they were answered, and the corpus |
| `profiles/`, `auto_profiles/`, `sessions/` | Named profiles, the per-domain ones the ladder makes, and the one-fetch isolated ones |
| `models/` | Models you installed, which win over the embedded ones |
| `browser/` | Chrome for Testing, provisioned automatically when absent |
| `in/`, `out/` | Where `file://` reads from, and where a relative `out_file` lands |
| `screenshots/` | What `web_screenshot` wrote |

## config.toml

### Browser and tiers

```toml
browser_path = ""            # wins over everything when set and the file exists. Order after
                             # that: SVIPALL_BROWSER / CHROME_PATH / CHROME_BIN /
                             # PUPPETEER_EXECUTABLE_PATH, then the one `browser install` put
                             # in ~/.svipall/browser, then auto-detection
max_tier = "warm"            # cap for mode=auto
browser_auto_install = true  # provision a managed browser on startup if none is installed
browser_identity = "auto"    # emulated routes first; native only as a last resort
auto_native_fallback = true  # false prohibits automatic real-device exposure
auto_max_attempts = 6        # per automatic fetch, including native; valid range 1..6
request_limit = 12           # top-level attempts per domain and exit in the window
request_window_seconds = 60
request_cooldown_seconds = 900
request_min_interval_ms = 1000
browser_timeout_ms = 45000
warm_wait_ms = 20000         # how long `warm` waits for a challenge to clear
warm_adaptive = true         # allow recognised proof-of-work to reach one renewal
warm_max_wait_ms = 55000     # hard warm-stage budget; the request timeout still applies
browser_idle_secs = 180
warm_keep_max = 2            # cleared pages held open between fetches; 0 disables holding
warm_keep_secs = 120         # how long a held page may go unused. Above the proof-of-work
                             # token lifetime and below browser_idle_secs — a test asserts both
http_engine = "auto"         # the emulating engine when built with `impersonate`, else reqwest
http_firefox = false         # present Gecko coherently: TLS, headers, UA, no Sec-CH-UA
http3 = false                # speak HTTP/3 to sites that advertised it. Needs `--features http3`
```

### Identity and exits

```toml
locale = ""                  # empty = follow the exit's declared country
timezone = ""
exit_strategy = "sticky"     # or round_robin, for domains with a pool of exits
reputation_budget = 250      # what one address may have outstanding with one host; 0 = off
reputation_half_life_hours = 6
dns_over_https = ""          # empty = off; not a network-wide DNS policy
```

### Crawling and output

```toml
parallelism = 4              # web_fetch_many / web_crawl; tightened further by machine load
max_tokens_per_fetch = 25000
max_tokens_total = 60000     # cap across a whole crawl
overlap_blocks = 1           # blocks of the previous page a `cursor` continuation repeats
```

### Policy

```toml
allow_origins = []
block_origins = []           # blocking wins over allowing
refuse_private_addresses = false  # OFF by default, and not because the risk is small:
                             # fetching http://localhost is an ordinary thing to ask for.
                             # Turn it on where an agent picks its own URLs.
local_roots = []             # directories file:// may read; empty = ~/.svipall/in only
block_ads = false            # a real trade: pages whose third parties all fail load differently
blocklist_sources = [        # only fetched when block_ads = true
  "https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts",
  "https://easylist.to/easylist/easyprivacy.txt",
]
```

### Solver, dashboard and REST

```toml
corpus_keep_days = 30        # how long solved captchas keep images for export-corpus; 0 = none
solver_workers = 4
dashboard_port = 8787
dashboard_bind = "127.0.0.1" # set to a LAN address to answer challenges from a phone
log_level = "info"

rest_port = 0                # 0 = off. `svipall serve` starts it anyway
rest_bind = "127.0.0.1"
api_key = ""                 # empty = ~/.svipall/api_key, generated and printed once
max_jobs = 2                 # long jobs at once — not `parallelism`
```

## Environment variables

| Variable | Default | Effect |
|---|---|---|
| `SVIPALL_HOME` | `~/.svipall` | Config, cache, profiles, models, blocklists |
| `SVIPALL_BROWSER` | — | Path to a browser binary. Also honoured: `CHROME_PATH`, `CHROME_BIN`, `PUPPETEER_EXECUTABLE_PATH` |
| `SVIPALL_HTTP_ENGINE` | `http_engine` | Which http engine runs; beats the config file |
| `SVIPALL_HUMAN_ASSIST` | on | Open a visible window when a token captcha cannot be auto-solved |
| `SVIPALL_HUMAN_WAIT_SECS` | 180 | How long that window waits |
| `SVIPALL_DASHBOARD_PORT` | `dashboard_port` | Port the human dashboard listens on |
| `SVIPALL_REST_PORT` | `rest_port` | Port the REST API listens on inside `svipall-mcp`. The Docker knob |
| `SVIPALL_API_KEY` | — | Pin the bearer key, for a container whose home is not writable |
