---
title: The command line
summary: Every command the binary answers to, what it prints, and the exit-code contract that treats a blocked page as a successful report.
group: Interfaces
order: 21
source: README.md
---

The same binary your agent talks to answers on the command line. Nothing is a
wrapper: it is one server with three front ends.

```bash
svipall fetch https://example.com/article
svipall fetch https://shop.example/item --query "shipping costs"
svipall fetch https://docs.example/api --schema auto   # rows from a listing you've never seen
svipall crawl https://docs.example/ --pages 50 --out pages.csv
svipall search "rust async runtime" --engine all
svipall snapshot https://news.ycombinator.com          # the page as roles and refs, not markup
svipall serve --port 8788                              # the same server as a local REST API
```

## The whole surface

```text
svipall fetch | crawl | snapshot | capture | search | map | log | notes | watch
        profile | browser | route | status | serve | doctor | hook
        config show | set | preset
        solver export-corpus
        quality ask | export-training | train
```

A test asserts the usage text names every command the binary answers to, and a
second test keeps `skill/SKILL.md` in step with both.

## What it prints

Completed data commands print **one JSON object** to stdout. Diagnostics go to
stderr, so the output pipes to `jq` cleanly. `serve` is a long-running server, and
help is written to stderr.

A historical run of `svipall fetch https://example.com`, with `content` cut short:

```json
{
  "attempts": ["http: 200 (170ms) OK"],
  "chars": 167,
  "content": "# Example Domain\n\nThis domain is for use in documentation examples…",
  "exit": null,
  "final_url": "https://example.com/",
  "optimization": "ordinary",
  "quality": "thin",
  "quality_reasons": ["thin_text"],
  "status": 200,
  "tier_used": "http",
  "title": "Example Domain",
  "tokens_estimated": 42,
  "url": "https://example.com"
}
```

Current automatic fetches also report identity and fallback fields.

`tier_used` says how hard it had to try. `quality` says what actually arrived.

## The exit-code contract

> **The exit code never depends on what a site said**
> A page that was blocked is a *successful report of a block*. The REST API
> inherits this verbatim, which is why a wall is a 200 there too.

A shell script that treated a wall as a failure would retry against something that is
never going to move. What failed and what refused are different questions, and the
exit code answers only the first.

When a page does not arrive, the same JSON object carries `blocked_reason`,
`wall_kind`, `wall_vendor`, `wall_evidence` and a `note`. From a committed benchmark
record:

```json
{ "wall_kind": "vendor", "wall_vendor": "kpsdk.io", "wall_evidence": "header x-kpsdk-ct" }
```

> **A verdict is not a content check**
> A detected block carries a verdict alongside the returned content. The classifier
> is not proof that the requested records arrived intact.

## Driving it from an agent that prefers a shell

Codex, opencode and anything else that would rather run a command than speak MCP can
use the CLI directly, for a fraction of the tokens. Copy `SKILL.md` from the release
archive into wherever that agent keeps its skills.

The human dashboard for challenges that need a pair of eyes is at
`http://localhost:8787/human`.
