---
title: MCP tools
summary: Twenty-nine tools, all local, and the tier ladder that web_fetch climbs when a page refuses.
group: Interfaces
order: 20
source: README.md
---

Twenty-nine tools, all local. This is the surface an agent sees, and it is the front
end most people install.

## The tier ladder

`mode=auto` climbs this. It is the whole behaviour of the tool in eight steps.

> **These are the emulated tiers**
> The current automatic policy can promote a supported emulated route and append one
> eligible native fallback. Wall verdicts can end an attempt; content-quality labels
> alone do not trigger escalation.

1. **Ask through HTTP first on a new route.** The default engine emulates selected
   Chrome network characteristics. Most pages stop here, and stopping at a tier is
   not the same as the page being delivered — the [proof page](/docs/proof) carries
   the per-run counts and the rule they are read under.
2. **If the page needs JavaScript, open a browser.** Headless Chromium runs the
   scripts and hands back the rendered document.
3. **If the site checks for robots, wear a disguise.** The stealth tier patches known
   browser surfaces to match the emulated identity. The offline probes check those
   surfaces; they cannot prove an arbitrary detector will accept them.
4. **If the site wants a real person, act like one.** The `real` tier is a
   visible-but-offscreen browser with a persistent profile, moving the pointer along
   curves and scrolling with a wheel.
5. **If there is a challenge, answer it or wait it out.** The `warm` tier runs the
   captcha strategy loop during its bounded wait, and avoids pointer activity on
   recognised self-verifying interstitials. This does not guarantee clearance.
6. **Use native only as a last resort.** When eligible and within the remaining
   budgets, one native browser attempt. It exposes real device characteristics and
   reports a privacy notice.
7. **Remember what worked.** Two supporting observations can promote a useful
   emulated route for later visits in the same context. Native stays last even when
   it succeeds.
8. **Report the observed failure.** Where available, a blocked result carries
   `blocked_reason`, the classified wall, recognised vendor and evidence, and a
   suggested next step.

> **Classification is heuristic**
> Transport errors and local budget deferrals may carry less page evidence. A clear
> verdict still needs a content check: the classifier is not proof that the
> requested records arrived intact.

## Pages

| Tool | What it does |
|---|---|
| `web_fetch` | Fetch a page as Markdown or structured JSON. `mode=auto` climbs the ladder. `schema` (self-healing), `tables`, `scroll`, `query`, `max_tokens`/`cursor`, `cache`, `include_metadata`, `include_links`, `include_quality`, `use_site_template`, `robots`, `out_file`, `mobile`, `text_only`, `isolated`, `css_selector`, `profile`, `proxy`, `method`/`body`/`headers`. URLs may be `raw:<html>` or `file://` under `local_roots` |
| `web_fetch_many` | Bounded-parallel fetch of many URLs, with `schema` and `tables` as on `web_fetch`. Reports `corroboration` — how many *distinct* documents the set actually is — marks each duplicate with `same_text_as`, and moves the different ones up. It says `reordered_for_diversity` when it did, because a set that comes back in a different order without saying so is a surprise, not a feature |
| `web_crawl` | Same-domain crawl with robots.txt, dedup, boilerplate removal, `strategy=dfs`, `scroll`, `schema`/`tables` for rows, `llms.txt`, file export, a saturation stop, and a `crawl_id` to resume |

## Finding things

| Tool | What it does |
|---|---|
| `web_search` | DuckDuckGo / Bing / Brave without an API key; `engine="all"` merges by agreement |
| `web_site_search` | Discover a site's search form and learn its query-URL pattern when possible; later fetches still follow normal routing and policy |
| `web_map` | A site's URLs without crawling it: robots.txt, sitemaps (nested indexes and `.gz` included), RSS/Atom feeds and homepage links — a few hundred tokens of structure instead of the thousands a crawl costs |

## A real browser

| Tool | What it does |
|---|---|
| `web_snapshot` | The page as roles, accessible names and short refs that `web_act` accepts. Deterministic, no vision model |
| `web_act` | click, type, fill, press, hover, select, scroll, wait, eval, goto, screenshot, hold, verify, console. Supported pointer/keyboard/wheel actions use the behaviour layer; `eval` runs caller-supplied JavaScript |
| `web_capture` | Observe matching JSON/network responses during a bounded browser visit. API usability and completeness are not guaranteed |
| `browser_open` / `browser_do` / `browser_close` | Persistent session with cookies and page state across calls |
| `web_screenshot` | PNG of the rendered page, `full_page` or `mobile` |

## Memory

| Tool | What it does |
|---|---|
| `web_diff` | What changed on a page since Svipall last saw it |
| `web_watch` | Persist a watch and check it while the server runs; list or check to retrieve changes. Region recovery after a redesign is heuristic |
| `web_notes` | Key-value memory that outlives the session |
| `web_log` | Which tier answered, which wall appeared, how long it took, per domain |

## Access and configuration

| Tool | What it does |
|---|---|
| `web_login` | Visible window for a manual login or challenge; cookies saved to a profile |
| `web_route` | Per-domain proxy, or a pool of `proxies` with `countries`; subdomains inherit; `exit_strategy` sticky or round-robin; `check=true` tests the exits (liveness, latency, DNS leak) with no third-party service |
| `web_profile` | Export/import an encrypted browser profile between machines |
| `web_status` | Learned tiers, cooldowns, routes, per-exit health and latency, profiles, open browsers, solver stats, which models answer and from where, whether the host has a real GPU, `h3_offered_by` |
| `browser_setup` | Download or manage Chrome for Testing |

## Captchas

| Tool | What it does |
|---|---|
| `solve_and_continue` | Attempt a captcha on the blocked page and return the resulting content, or the unresolved state |
| `solve_image_captcha` · `solve_recaptcha_v2` · `solve_turnstile` · `solve_hcaptcha` · `captcha_status` · `report_captcha` | Local captcha attempts. The dashboard also exposes `in.php` / `res.php` / `createTask` / `getTaskResult` compatibility endpoints for supported tasks — **not** full compatibility with every solver-client option |

## What comes back

`tier_used` says how hard it had to try. `quality` says what actually arrived. When a
page does *not* arrive, the same object carries `blocked_reason`, `wall_kind`,
`wall_vendor`, `wall_evidence` and a `note` telling your agent what to do next.

From a committed benchmark record:

```json
{ "wall_kind": "vendor", "wall_vendor": "kpsdk.io", "wall_evidence": "header x-kpsdk-ct" }
```
