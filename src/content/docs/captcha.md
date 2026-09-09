---
title: Captchas
summary: Nine automatic strategies, fifteen widget families, the embedded models, and the human dashboard for everything that is left.
group: Behaviour
order: 32
source: docs/captcha.md
---

Fully local. There is no paid solver behind any of this, and no quota to buy.

**Nine automatic strategies**, ordered on each page by what has actually worked on
that domain before (`outcomes`). A strategy that declines costs no attempt, and there
is never a cascade of `if`s.

## What gets attempted

| Challenge | Automatic attempt | Fallback |
|---|---|---|
| Turnstile, reCAPTCHA v2/v3, hCaptcha | The real page loads in a stealth browser and the token is read when the widget clears | A visible window opens for a person (`SVIPALL_HUMAN_ASSIST=0` to disable) |
| Proof of work (hash puzzles) | Locally compute a nonce for a recognised puzzle, within the wait budget. Unsupported puzzles can decline, and site acceptance can still fail | Unresolved state, or human assistance where usable |
| Press and hold | Held on the real iframe button for the measured interval, with a real approach and press. Two attempts, then one retry on a fresh profile — and the flagged profile is retired | Visible window |
| Slider / rotation | Classical vision on a screenshot: cross-correlation for the notch, edge-energy minimisation for the angle. Three attempts, since both have a tolerance | Human dashboard |
| Drag a piece into place | Geometry on the same screenshot | Human dashboard |
| Self-verifying interstitial ("Just a moment") | Avoid pointer activity; eligible progress can extend the wait once within the configured budget | Visible window |
| Image grid ("select all…") | Local classifier, tiles clicked as real pointer input, two attempts | The embedded detector, then a zero-shot pair, then a visible window |
| 4×4 single-picture grid | The **embedded segmenter** marks every cell its mask touches | Dashboard |
| "Click on the …" / "draw a box around the …" | The **embedded detector**: centres clicked or the strongest box traced, as fractions of the picture | Dashboard (two taps make a rectangle) |
| Image-to-text | Standalone image API: local OCR (`--features onnx-ocr`, operator-provided CRNN/CTC model). `Modality::Text` is intentionally excluded from the live page loop | Dashboard shows the image |
| Audio | Local acoustic model (`--features onnx-audio`), clip fetched from inside the page, decoded in pure Rust | Dashboard plays the clip |
| Other detected challenges | Fifteen widget families and eleven answer modalities are represented; generic detection can identify some additional widgets | Dashboard where a supported modality and usable asset are available |

> **Unknown challenges can stay unresolved**
> Widget identifiers use challenge endpoint hosts. Fixture tests check recognition,
> and that listed modalities have a compatible answer path. Those tests do **not**
> prove a live vendor still uses the same markup, or accepts the answer.

## The embedded models

A detector (SSDLite320-MobileNetV3, 13.8 MB) and a segmenter (DeepLabV3-MobileNetV3,
44.1 MB). Torchvision weights under BSD-3, running on the CPU.

Where included, they enable local attempts for supported subjects without downloading
weights at run time. They do not guarantee a correct answer, or acceptance by a
widget.

A compatible model you train from your own corpus and drop in `~/.svipall/models/`
**wins over the embedded one, and is picked up without a restart**.

> **Not a blob you have to trust**
> `tools/models/export.py` regenerates both from torchvision's published weights —
> no account, no key, no service — and `docs/models.md` states the contract each one
> has to keep.

### Which builds carry them

The release workflow includes the export assets in Windows x86-64 and Apple-silicon
builds, and the full container on both architectures. Linux and Intel-Mac binary jobs
omit them because of the configured ONNX Runtime distribution constraints.

That describes the build matrix, not an installation test on every platform. Inspect
the installed build with `svipall doctor`.

**Which strategies need models.** The live image-grid, point, polygon and audio
strategies depend on suitable models; standalone OCR is a separate model-dependent
path. Proof-of-work, slider, rotation, drag and hold use computation or image
geometry and need no ONNX weights.

Missing models leave human assistance as a fallback where enabled and usable. The
page can still remain unresolved.

An unsupported class or insufficient confidence can make a model strategy decline.
Confidence thresholds do not eliminate wrong predictions.

## The human dashboard

`http://localhost:8787/human`, and on your LAN address when `dashboard_bind` is not
loopback. One renderer per modality, and it works from a phone.

**Every coordinate it sends is a fraction of the image, never a pixel**, so resizing
can preserve its relative position. The chosen answer can still be wrong.

The answer is checked against the modality of the job it answers *before* it is
stored, so a mismatch is a rejection at the door with a reason, rather than a wrong
answer discovered a minute later by the site.

> **"I cannot read this" is a real answer**
> `Unknown` is the option that keeps the ranking honest. An unsolved challenge
> expires after 30 minutes; a page-rating card, which nobody is waiting on, does
> not.

## Training your own

```bash
cargo build --release --features onnx-ocr,onnx-grid,onnx-audio,onnx-detect,onnx-segment,onnx-zeroshot
```

| Feature | Embedded? | Files in `~/.svipall/models/` |
|---|---|---|
| `onnx-detect` | when export assets are included, 13.8 MB | `detect.onnx`, `detect.json` |
| `onnx-segment` | when export assets are included, 44.1 MB | `segment.onnx`, `segment.json` |
| `onnx-grid` | no | `grid.onnx`, `grid.json` |
| `onnx-ocr` | no | `captcha.onnx`, `captcha.json` |
| `onnx-audio` | no | `audio.onnx`, `audio.json` |
| `onnx-zeroshot` | no | `clip_image.onnx`, `clip_text.onnx`, `clip.json`, `vocab.json`, `merges.txt` |
| page substance | no (not ONNX) | `substance.bin`, `substance.json` — fit by `svipall quality train` |

A detector output whose class axis does not equal `4 + classes.len()` is **refused,
not reshaped**.

### Exporting the corpus

Supported challenge assets and outcomes can be recorded locally when solver state is
available and `corpus_keep_days` is positive — 30 days by default.

```bash
svipall solver export-corpus --out ./corpus
```

That writes the recorded images and a `manifest.jsonl` with the prompt, the answer,
who answered, and whether the page accepted it: training data for your own models.

> **Not an independent correctness label**
> Rows with `"source":"human","ok":true` record a human answer and the live
> observer's acceptance result. That is not the same as the answer being right.
