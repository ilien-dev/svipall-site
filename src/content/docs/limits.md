---
title: What it can't do
summary: The permanent limits, stated on purpose, with the one that is a build choice marked as a build choice.
group: Behaviour
order: 33
source: docs/limits.md
---

Most of what follows is permanent and deliberate. One item is a build you have to
ask for, and it is marked as one rather than left to look like a shortcoming.

None of these are bugs waiting to be fixed. They are where the tool stops.

## No bundled proxies, and no IP rotation

You bring your own exit. Svipall configures the declared timezone, locale and
languages, and applies the DNS and WebRTC controls it supports.

It does **not** guarantee that all browser traffic uses that exit, and it does not
detect the exit's country — that would need a geolocation service, so you declare
the country yourself.

## No paid or remote captcha solving

There is no solver quota to buy. Solving quality is bounded by the models you
supply and by your own hands.

Site restrictions and local attempt and time budgets still apply. A challenge that
is not resolved can be parked for a human and the answer replayed on the live page.

## HTTP/3 is off by default — a build choice, not a limit

It works. A vendored quiche on the same BoringSSL the http tier already links,
emitting Chrome's QUIC ClientHello (ALPS 17613, ECH GREASE, `compress_certificate`,
`trust_anchors`, extension permutation, a GREASE transport parameter) and Chrome's
HTTP/3 SETTINGS frame. Both are asserted offline against a capture of a real Chrome
that `bench h3-ref` takes from a loopback QUIC server a real browser handshakes
with.

It is off for two reasons. A QUIC stack is 37,000 vendored lines to carry for a
transport most sites still do not offer. And it can only ever be a *second* visit:
`Alt-Svc` is how a site says it speaks h3, so the first fetch of any domain is TCP
exactly as before.

To turn it on, build with `--features http3` and set `http3 = true`.

### What was measured

Four of twelve `hard12` targets advertise h3 at all, and the evasion median does
not move: 8/12 either way, against a noise floor of 123–369 s per run.

What does move is cost. On a site that offers h3 and walls the cheap tier over TCP,
a page arrives in **950 ms at the http tier instead of 2,967 ms with a browser**,
five runs each. The worst case — a site that advertises h3 and does not deliver —
is one extra 568 ms, once per domain per six hours.

> **Still not Chrome**
> The `trust_anchors` payload is empty where Chrome sends a list, and one extension
> Chrome sends (`0x12e0`) is not in this BoringSSL at all. An h3 engine therefore
> carries a Chrome version ceiling of its own, set by the age of the linked
> library.

The whole record — including the two reasons this project previously gave for not
doing HTTP/3, and why both were wrong — is in `docs/http3.md`.

## Browser fingerprint defences can conflict with emulation

Brave is a recorded case: with it selected, a public detector saw `navigator.brave`
and randomised plugin names sitting next to a User-Agent claiming Chrome. Brave,
Vivaldi and Opera are therefore sorted last among detected browsers.

A build **two or more majors** behind the stable channel is flagged for the opposite
reason: it differs substantially from the reference stable channel.

> **This is a heuristic**
> It is a diagnostic signal, not proof that anything detected you. `web_status` and
> applicable blocked-result notes can report these conditions, and `browser_setup`
> installs or updates a dedicated Chrome for Testing.

## Software rendering can affect fingerprint consistency

A browser may report `SwiftShader` or `llvmpipe` when there is no hardware
acceleration. That does not uniquely identify a virtual machine.

Changing a renderer string does not reproduce the claimed hardware's output.
`web_status` reports detected GPU limitations. Supplied model paths support CPU
execution; speed depends on the machine.

## Injected page content can affect detection

In a recorded run, a local security product injected resources into pages.

Svipall can report recognised injection evidence in a blocked result. It cannot
reliably identify every injecting product, and it cannot remove one.
