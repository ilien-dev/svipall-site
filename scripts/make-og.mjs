/*
 * make-og.mjs — draws public/og.png, the share card.
 *
 * Run it by hand after changing the card, then commit the PNG:
 *
 *   node scripts/make-og.mjs
 *
 * It is not part of `npm run build`. The card changes about as often as the
 * logo does, and wiring a headless browser into every build to redraw a file
 * that did not change would cost more than it saves.
 *
 * Headless Chromium rather than resvg or rsvg-convert, for one reason: the
 * card sets type in Urbanist and IBM Plex Mono, and both ship here as woff2,
 * which the SVG rasterisers' font databases do not read. A browser does, and
 * it is the same engine the site itself is drawn by, so the card's type is
 * the site's type rather than a near miss.
 *
 * 1200x630 is the size Slack, Twitter/X, LinkedIn, Discord and iMessage all
 * crop a large card to. Anything squarer gets letterboxed, and a square image
 * is why this card used to unfurl as a thumbnail beside the text instead of a
 * banner above it.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public', 'og.png');

const WIDTH = 1200;
const HEIGHT = 630;

/* The brand's ink, paper and alert red (svipall assets/brand/tokens.json). */
const NIGHT = '#050506';
const BONE = '#EDEBE8';
const RED = '#E5303A';

const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

// The mark for dark grounds (a paper hat and the red eye), sized by the card's CSS.
const mark = read('src/assets/brand/svipall-mark-dark.svg')
  .replace(/<!--[sS]*?-->/g, '')
  .replace(/swidth="[^"]*"|sheight="[^"]*"/g, '');

// The wordmark is outlined in currentColor, so the card's text colour paints it.
const wordmark = read('src/assets/brand/svipall-wordmark.svg')
  .replace(/<!--[sS]*?-->/g, '')
  .replace(/swidth="[^"]*"|sheight="[^"]*"/g, '');

const fontData = (file) =>
  fs.readFileSync(path.join(root, 'public', 'fonts', file)).toString('base64');

const html = `<!doctype html>
<html><head><meta charset="utf-8">
<style>
  @font-face {
    font-family: 'Urbanist';
    font-weight: 100 900;
    font-display: block;
    src: url(data:font/woff2;base64,${fontData('urbanist-variable.woff2')}) format('woff2');
  }
  @font-face {
    font-family: 'IBM Plex Mono';
    font-weight: 400;
    font-display: block;
    src: url(data:font/woff2;base64,${fontData('plexmono-400.woff2')}) format('woff2');
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${WIDTH}px; height: ${HEIGHT}px;
    background: ${NIGHT};
    font-family: 'Urbanist', sans-serif;
    color: ${BONE};
    overflow: hidden;
  }
  /* A single soft light behind the mark, so the ground is not a flat
     rectangle. Low opacity on purpose: the unfurl is shown at about a third
     of this size and anything stronger reads as a smudge there. */
  .glow {
    position: absolute; inset: 0;
    background: radial-gradient(60% 75% at 22% 50%, rgba(229, 48, 58, 0.12), transparent 70%);
  }
  .card {
    position: relative;
    height: 100%;
    display: grid;
    grid-template-columns: 286px 1fr;
    align-items: center;
    gap: 60px;
    padding: 0 76px;
  }
  .mark { width: 286px; display: flex; justify-content: center; }
  .mark svg { width: 286px; height: auto; display: block; }
  .wordmark { width: 340px; color: ${BONE}; }
  .wordmark svg { width: 100%; height: auto; display: block; }
  .line {
    margin-top: 30px;
    font-size: 41px;
    font-weight: 500;
    line-height: 1.18;
    letter-spacing: -0.015em;
    max-width: 17ch;
  }
  .foot {
    margin-top: 38px;
    display: flex; align-items: center; gap: 20px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 21px;
    white-space: nowrap;
  }
  .chip {
    border: 1.5px solid rgba(237, 235, 232, 0.32);
    border-radius: 9px;
    padding: 10px 18px;
  }
  .host { color: rgba(237, 235, 232, 0.66); }
</style></head>
<body>
  <div class="glow"></div>
  <div class="card">
    <div class="mark">${mark}</div>
    <div>
      <div class="wordmark">${wordmark}</div>
      <p class="line">Your AI asks. Svipall goes and gets the page.</p>
      <div class="foot">
        <span class="chip">/plugin install svipall@svipall</span>
        <span class="host">svipall.ilien.dev</span>
      </div>
    </div>
  </div>
</body></html>`;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'svipall-og-'));
const page = path.join(tmp, 'card.html');
fs.writeFileSync(page, html);

const chromium = process.env.CHROMIUM || ['chromium', 'chromium-browser', 'google-chrome-stable', 'google-chrome'].find(
  (bin) => {
    try {
      execFileSync('which', [bin], { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
);

if (!chromium) {
  console.error('No Chromium found. Install chromium, or run this where one exists.');
  process.exit(1);
}

execFileSync(chromium, [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--default-background-color=00000000',
  `--window-size=${WIDTH},${HEIGHT}`,
  `--screenshot=${out}`,
  page,
]);

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`Wrote ${path.relative(root, out)} at ${WIDTH}x${HEIGHT}.`);
