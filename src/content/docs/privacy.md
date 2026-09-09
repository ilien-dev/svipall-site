---
title: What leaves your machine
summary: What Svipall sends, what it never sends, and the four safety boundaries it does not claim to hold.
group: Evidence
order: 41
source: docs/privacy.md
---

Svipall runs on your machine. There is no account, no key and no service in the
middle. What follows is the exact shape of that claim, including the places where
it stops.

## No telemetry, and no update polling

Svipall sends nothing about you anywhere. There is no usage reporting and no
periodic check for a new version.

Other traffic still happens, because browsing is traffic:

- Page resources, redirects, challenge endpoints and any other origin a page uses.
- The configured resolver, if DNS-over-HTTPS is on.
- Chrome for Testing downloads at startup when no browser is installed and browser
  tiers are enabled. Explicit `browser install` / `browser_setup` also contacts the
  release metadata and download servers. Set `browser_auto_install=false` to stop
  automatic provisioning.
- The configured blocklists when `block_ads=true` — StevenBlack/hosts and
  EasyPrivacy by default — fetched and cached.

Results go back to whatever client you connected. What that client then does with
them is that client's business, not Svipall's.

> **Not a firewall**
> A launched browser can generate traffic of its own. Svipall does not stand
> between the browser and the network.

## Hidden-text sanitisation is partial

Extraction removes selected hidden elements, inline hiding styles and zero-width
characters. It does **not** resolve the full CSS cascade, and it does not detect all
hidden content.

> **Treat page content as untrusted**
> Visible malicious instructions can survive sanitisation. This is not a complete
> prompt-injection defence.

## Credentials can be referenced without passing values

A tool call can name a secret instead of carrying it:

```json
{"do": "type", "ref": "e4", "text": "${SHOP_PASSWORD}"}
```

The value is substituted from `~/.svipall/secrets.env` on the way to the browser.
`web_status` lists the names and never the values.

> **Substitution is not redaction**
> Returned page text, screenshots and API responses can still show data the site
> itself displays. Nothing scrubs the output.

## Origin policy, checked before the request

- `allow_origins` and `block_origins` — blocking wins.
- `block_ads` — cached lists, silent when offline.
- `refuse_private_addresses` — stops an agent following a link to
  `169.254.169.254`.

`refuse_private_addresses` is **off by default**, deliberately: fetching
`http://localhost` is an ordinary thing to ask a local-first tool to do. Turn it on
for an installation where an agent chooses its own URLs.

`robots.txt` is reported by default, and can be made binding with `robots=obey`.

## No breaking of access controls

Svipall evades bot detection on public pages. That is the whole of what it does.

It does not crack passwords, bypass paywalls, or forge authentication. A login wall
is passed by **you**, once, in a visible window, and the cookies are kept.
