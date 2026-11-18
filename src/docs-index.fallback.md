# Svipall documentation

Used only when the release being published has no `docs/README.md` of its own
(every release before the index was added). From the next release on, the
product repository's index is the one read, and this file is ignored.

## Start here

- [Install](install.md): every way to install Svipall, and how to wire it into an AI app.
- [Update](update.md): moving to a newer release.
- [FAQ](faq.md): short answers to the common questions.

## Using it

- [Features](features.md): what each tool does, in detail.
- [Extraction](extraction.md): how a page becomes Markdown, rows or JSON.
- [Captcha](captcha.md): the challenges it attempts locally, and the human dashboard.
- [REST API](rest.md): the same server over local HTTP.
- [Configuration](configuration.md): every setting, and where it lives.
- [Exits](exits.md): proxies and routes, per domain.
- [HTTP/3](http3.md): when QUIC is used, and when it is not.
- [Models](models.md): the local models, where they come from, and bringing your own.
- [Firefox engine](firefox.md): what ships today, and what the fork adds.

## Evidence

- [Proof](proof.md): every number, with the command that reproduces it.
- [Benchmarks](bench.md): the benchmarks, and the rules they are read under.
- [Limits](limits.md): what it does not do, stated on purpose.
- [Privacy and safety](privacy.md): what leaves your machine, and when.

## Internals

- [Architecture](architecture.md): how the crates fit together.
- [Development](development.md): building, testing and the quality gate.
