#!/usr/bin/env node
/**
 * ptah-check.mjs - static verifier for a Ptah design ledger.
 *
 * Zero dependencies. One implementation, five callers:
 *   - the Claude Code PostToolUse hook
 *   - CI
 *   - Ptah's parity loop (gate 8)
 *   - adopt mode's baseline census (step 2)
 *   - a person, by hand
 *
 * Usage
 *   node .ptah/ptah-check.mjs --all
 *   node .ptah/ptah-check.mjs --changed
 *   node .ptah/ptah-check.mjs --files src/a.css src/b.tsx
 *   node .ptah/ptah-check.mjs --all --census            (adopt mode, no ledger needed)
 *
 * Flags
 *   --json         machine output
 *   --sarif        SARIF 2.1.0, for CI code scanning
 *   --census       measure drift instead of judging it; implies --no-ledger-rules
 *   --no-ledger-rules   run only the checks that need no project ledger
 *   --baseline     ignore findings recorded in .ptah/baseline.json
 *   --write-baseline   record current findings as accepted, then exit 0
 *   --quiet        suppress the passing lines, keep the failures
 *
 * Exit codes
 *   0  clean
 *   1  violations found
 *   2  misconfiguration (no ledger, bad JSON, bad arguments)
 *
 * THREE CLASSES OF RULE
 *   floor    Craft. Contrast, measure, focus, states, heading order. No brief overrules
 *            these and no licence suppresses them.
 *   system   This project's declared scales, palette and faces. Another project would
 *            have different values; the class is what makes the tool not a style guide.
 *   default  The era's reflexes, from slop-catalog.md. Blocking unless the ledger
 *            carries a licence naming the brief line that earns it.
 *
 * WHAT THIS TOOL CANNOT SEE
 * It reads source, not pixels. It cannot judge composition, visual hierarchy,
 * whether the type pairing works, or whether the one aesthetic risk landed.
 * A clean run is not evidence that the design is right. Those rules are verified
 * in Ptah's visual loop and parity loop, where a screenshot is the evidence.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { execSync } from "node:child_process";

const CWD = process.cwd();

// Find the nearest .ptah/ walking upward, so a monorepo works: an app with its own
// ledger uses it, and one without inherits the root's. Resolving only against the
// current directory is a documented failure mode in tools of this kind - the hook
// fires from an app directory, finds nothing, and silently enforces nothing.
// Nearest wins, because nearest is most specific.
function findPtahDir(start) {
  let dir = resolve(start);
  for (;;) {
    const candidate = join(dir, ".ptah");
    if (existsSync(join(candidate, "rules.json"))) return candidate;
    const up = resolve(dir, "..");
    if (up === dir) return resolve(start, ".ptah"); // none found: report against CWD
    dir = up;
  }
}
const PTAH_DIR = findPtahDir(CWD);
const RULES_PATH = join(PTAH_DIR, "rules.json");
const BASELINE_PATH = join(PTAH_DIR, "baseline.json");

/* ------------------------------------------------------------------ args - */

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const opts = {
  all: has("--all"),
  changed: has("--changed"),
  json: has("--json"),
  sarif: has("--sarif"),
  census: has("--census"),
  noLedgerRules: has("--no-ledger-rules") || has("--census"),
  baseline: has("--baseline"),
  writeBaseline: has("--write-baseline"),
  quiet: has("--quiet"),
};
const fileArgs = (() => {
  const i = argv.indexOf("--files");
  if (i === -1) return [];
  return argv.slice(i + 1).filter((a) => !a.startsWith("--"));
})();
const hookMode = (() => {
  const i = argv.indexOf("--hook");
  return i === -1 ? null : argv[i + 1];
})();

function die(msg) {
  process.stderr.write(`ptah-check: ${msg}\n`);
  process.exit(2);
}

// A hook must never break the session it is attached to. If the ledger is missing,
// this project simply is not a Ptah project: say nothing and get out of the way.
const hasLedger = existsSync(RULES_PATH);
if (!hasLedger && !opts.noLedgerRules) {
  if (hookMode) process.exit(0);
  die(`no ledger at ${relative(CWD, RULES_PATH)}. Run the Ptah interview first, ` +
      `or pass --census to measure an existing codebase before adopting.`);
}
if (!hookMode && !opts.all && !opts.changed && fileArgs.length === 0) {
  die("nothing to check. Pass --all, --changed, --files <paths>, or --hook <event>.");
}

let ledger = {};
if (hasLedger) {
  try {
    ledger = JSON.parse(readFileSync(RULES_PATH, "utf8"));
  } catch (e) {
    die(`could not parse ${relative(CWD, RULES_PATH)}: ${e.message}`);
  }
}

/* ------------------------------------------------------- ledger defaults - */

const cfg = {
  include: ledger.include ?? [
    "**/*.css", "**/*.scss", "**/*.html", "**/*.astro", "**/*.svelte",
    "**/*.jsx", "**/*.tsx", "**/*.vue",
  ],
  exclude: ledger.exclude ?? [
    "node_modules/**", ".git/**", ".ptah/**", "**/.ptah/**", "dist/**", "build/**",
    ".next/**", ".astro/**", "coverage/**", "**/*.min.*",
  ],
  tokenFiles: ledger.tokenFiles ?? [],
  rootFontSizePx: ledger.rootFontSizePx ?? 16,
  scales: ledger.scales ?? {},
  fonts: ledger.fonts ?? {},
  palette: ledger.palette ?? [],
  bannedCopy: ledger.bannedCopy ?? [],
  forbiddenEvidence: ledger.forbiddenEvidence ?? [],
  contrast: ledger.contrast ?? {},
  measure: ledger.measure ?? { minCh: 45, maxCh: 75 },
  licences: ledger.licences ?? [],
  disabled: new Set(ledger.disabledChecks ?? []),
  // Gate 3's material declarations. Recorded for the report and the digest;
  // only the ones carrying a pattern are mechanically checkable.
  nonNegotiables: ledger.nonNegotiables ?? [],
  signature: ledger.signature ?? null,
};

/* ------------------------------------------------------- rule registry - */
/* Every id declares its class. The class is not cosmetic: it decides whether a
   licence can suppress the finding, and it is what keeps this tool from becoming
   the style guide it exists to replace. */

const RULES = {
  // --- floor: craft. No licence, ever. -------------------------------------
  "outline-none":         { class: "floor",  title: "focus ring removed with no replacement" },
  "input-font-size":      { class: "floor",  title: "input font-size below 16px" },
  "tiny-text":            { class: "floor",  title: "text below the legible floor" },
  "line-height-body":     { class: "floor",  title: "body leading below 1.3" },
  "measure":              { class: "floor",  title: "line length outside 45-75 characters" },
  "justified-no-hyphens": { class: "floor",  title: "justified text without hyphenation" },
  "all-caps-body":        { class: "floor",  title: "uppercase on running text" },
  "wide-tracking-body":   { class: "floor",  title: "letter-spacing above 0.05em on body text" },
  "font-no-fallback":     { class: "floor",  title: "typeface declared with no fallback stack" },
  "zoom-disabled":        { class: "floor",  title: "browser zoom disabled" },
  "tap-target":           { class: "floor",  title: "hit target below 24px" },
  "reduced-motion":       { class: "floor",  title: "motion with no prefers-reduced-motion branch" },
  "transition-all":       { class: "floor",  title: "transition: all" },
  "animate-layout":       { class: "floor",  title: "animating a layout property" },
  "heading-skip":         { class: "floor",  title: "heading level skipped" },
  "img-no-alt":           { class: "floor",  title: "image with no alt" },
  "img-no-dimensions":    { class: "floor",  title: "image with no width and height" },
  "img-empty-src":        { class: "floor",  title: "image with empty or placeholder src" },
  "div-onclick":          { class: "floor",  title: "navigation or action on a non-interactive element" },
  "rest-opacity-zero":    { class: "floor",  title: "content resting at opacity 0" },
  "theme-only-token":     { class: "floor",  title: "token defined only inside a theme block" },
  "token-contrast":       { class: "floor",  title: "declared token pair fails its contrast target" },
  "forbidden-evidence":   { class: "floor",  title: "evidence the truth ledger forbids" },

  // --- system: this project's declared decisions ---------------------------
  "banned-fonts":         { class: "system", title: "typeface outside the declared pairing" },
  "color-literal":        { class: "system", title: "colour literal outside the token layer" },
  "space-literal":        { class: "system", title: "spacing off the declared scale" },
  "font-size-literal":    { class: "system", title: "font-size off the declared scale" },
  "radius-literal":       { class: "system", title: "border-radius off the declared scale" },
  "border-width-literal": { class: "system", title: "border width off the declared edge scale" },
  "shadow-literal":       { class: "system", title: "shadow outside the declared set" },
  "z-index-literal":      { class: "system", title: "z-index off the declared scale" },
  "duration-literal":     { class: "system", title: "duration off the declared scale" },
  "banned-copy":          { class: "system", title: "banned copy word" },
  "idiom-unrealised":     { class: "system", title: "a declared idiom assertion the source never realises" },

  // --- default: the era's reflexes. Licensable. ----------------------------
  "viewport-height-hero": { class: "default", title: "full-viewport-height section" },
  "crushed-tracking":     { class: "default", title: "letter-spacing tighter than -0.04em" },
  "nested-cards":         { class: "default", title: "a card inside a card" },
  "gradient-text":        { class: "default", title: "gradient clipped to text" },
  "copy-cadence":         { class: "default", title: "generated-copy cadence" },
};

const classOf = (id) => RULES[id]?.class ?? "system";

// A licence suppresses a `default` finding and nothing else. Floor is craft and
// system is the project's own word; neither is licensable by construction.
const licenceIndex = new Map();
for (const l of cfg.licences) {
  if (!l?.rule) continue;
  if (classOf(l.rule) !== "default") continue;   // silently inapplicable, reported below
  if (!licenceIndex.has(l.rule)) licenceIndex.set(l.rule, []);
  licenceIndex.get(l.rule).push(l);
}
const invalidLicences = cfg.licences.filter((l) => l?.rule && classOf(l.rule) !== "default");
const licencesUsed = new Set();

/* --------------------------------------------------------------- globbing - */

function globToRegExp(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        // ** matches across separators; **/ also matches zero directories
        if (glob[i + 2] === "/") { re += "(?:.*/)?"; i += 2; }
        else { re += ".*"; i += 1; }
      } else re += "[^/]*";
    } else if (c === "?") re += "[^/]";
    else if (c === "{") {
      const end = glob.indexOf("}", i);
      if (end === -1) { re += "\\{"; continue; }
      re += "(?:" + glob.slice(i + 1, end).split(",").map(escapeRe).join("|") + ")";
      i = end;
    } else re += escapeRe(c);
  }
  return new RegExp("^" + re + "$");
}
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

const includeRes = cfg.include.map(globToRegExp);
const excludeRes = cfg.exclude.map(globToRegExp);
const tokenFileRes = cfg.tokenFiles.map(globToRegExp);

const norm = (p) => relative(CWD, resolve(CWD, p)).split(sep).join("/");
const isIncluded = (p) => includeRes.some((r) => r.test(p)) && !excludeRes.some((r) => r.test(p));
const isTokenFile = (p) => tokenFileRes.some((r) => r.test(p));

function licensedHere(id, file) {
  const ls = licenceIndex.get(id);
  if (!ls) return false;
  for (const l of ls) {
    if (!l.scope) { licencesUsed.add(id); return true; }
    const res = (Array.isArray(l.scope) ? l.scope : [l.scope]).map(globToRegExp);
    if (res.some((r) => r.test(file))) { licencesUsed.add(id); return true; }
  }
  return false;
}

/* ------------------------------------------------------------ file selection - */

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const full = join(dir, e.name);
    const rel = norm(full);
    if (e.isDirectory()) {
      if (excludeRes.some((r) => r.test(rel + "/") || r.test(rel))) continue;
      walk(full, out);
    } else if (isIncluded(rel)) out.push(rel);
  }
  return out;
}

function changedFiles() {
  try {
    const tracked = execSync("git diff --name-only HEAD", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const untracked = execSync("git ls-files --others --exclude-standard", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return [...new Set((tracked + "\n" + untracked).split("\n"))]
      .map((s) => s.trim()).filter(Boolean).filter(isIncluded).filter((p) => existsSync(p));
  } catch {
    process.stderr.write("ptah-check: not a git repository, falling back to --all\n");
    return walk(CWD);
  }
}

/* -------------------------------------------------------------- hook modes - */

// SessionStart runs before any target selection: it injects context, it checks nothing.
if (hookMode === "session-start") {
  const digestPath = join(PTAH_DIR, "digest.md");
  if (!existsSync(digestPath)) process.exit(0);
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: readFileSync(digestPath, "utf8"),
    },
  }) + "\n");
  process.exit(0);
}

function readHookStdin() {
  try { return JSON.parse(readFileSync(0, "utf8")); } catch { return {}; }
}

let hookPath = null;
if (hookMode === "post-tool-use" || hookMode === "file-changed") {
  const payload = readHookStdin();
  hookPath = payload?.tool_input?.file_path ?? payload?.file_path ?? payload?.path ?? null;
  if (!hookPath) process.exit(0);
  hookPath = norm(hookPath);
  if (!isIncluded(hookPath) || !existsSync(hookPath)) process.exit(0);
}

let targets;
if (hookPath) targets = [hookPath];
else if (fileArgs.length) targets = fileArgs.map(norm).filter((p) => isIncluded(p) && existsSync(p));
else if (opts.changed) targets = changedFiles();
else targets = walk(CWD);

/* ----------------------------------------------------------------- helpers - */

const findings = [];
const suppressions = [];
const licensed = [];

function report(id, file, line, message, opts2 = {}) {
  const cls = classOf(id);
  if (cls === "default" && licensedHere(id, file)) {
    licensed.push({ id, file, line });
    return;
  }
  findings.push({
    id, file, line,
    class: cls,
    message,
    heuristic: opts2.heuristic === true,
    source: (ledger.rules?.find?.((r) => r.id === id) || {}).source ?? null,
  });
}

// An inline escape hatch. Suppressions are never silent: they are counted and
// printed, so an accumulation of them is visible rather than forgotten.
const SUPPRESS = /ptah-allow(?::\s*([A-Za-z0-9-]+))?/;
function suppressed(lineText, id, file, lineNo) {
  const m = lineText.match(SUPPRESS);
  if (!m) return false;
  if (m[1] && m[1] !== id) return false;
  suppressions.push({ id, file, line: lineNo });
  return true;
}

function lengthsIn(value) {
  return [...value.matchAll(/(-?\d*\.?\d+)(px|rem|em)\b/g)].map((m) => ({
    raw: m[0], n: parseFloat(m[1]), unit: m[2],
  }));
}
function toPx(l) {
  if (l.unit === "px") return l.n;
  if (l.unit === "rem") return l.n * cfg.rootFontSizePx;
  return null; // em depends on inherited size; not judged statically
}
function scalePx(name) {
  const raw = cfg.scales[name];
  if (!Array.isArray(raw)) return null;
  return new Set(raw.map((v) => {
    const l = lengthsIn(String(v))[0];
    return l ? toPx(l) : (parseFloat(v) || null);
  }).filter((n) => n !== null));
}
function scaleRaw(name, normalise = (v) => String(v).trim().toLowerCase()) {
  const raw = cfg.scales[name];
  if (!Array.isArray(raw)) return null;
  return new Set(raw.map(normalise));
}
// A shadow is matched as a whole string, so the comparison has to survive the
// cosmetic differences a formatter introduces: run-together whitespace, a space
// after a comma, and `0px` where the declaration said `0`. Without this a project
// with a real depth model is punished for having one and a project with no
// shadows pays nothing, which is a bias toward flatness living in the checker
// rather than in anyone's brief.
function normaliseShadow(v) {
  return String(v).trim().toLowerCase()
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s+/g, " ")
    .replace(/\b0(?:px|rem|em)\b/g, "0");
}
const spaceScale  = scalePx("space");
const fontScale   = scalePx("fontSize");
const radiusScale = scalePx("radius");
const borderWidthScale = scalePx("borderWidth");
const zIndexScale = cfg.scales.zIndex ? new Set(cfg.scales.zIndex.map(Number)) : null;
const shadowScale = scaleRaw("shadow", normaliseShadow);
const durationSet = cfg.scales.duration
  ? new Set(cfg.scales.duration.map((v) => String(v).trim().toLowerCase()))
  : null;

const enabled = (id) => !cfg.disabled.has(id) && !(opts.noLedgerRules && classOf(id) !== "floor");

/* ------------------------------------------------------------ colour maths - */
/* Needed for token-contrast. Everything here is exact arithmetic on declared
   values: no browser, no rendering, no guessing. A colour the parser cannot
   resolve is reported as unresolvable rather than assumed to pass. */

function srgbFromHex(h) {
  h = h.replace("#", "");
  if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6 && h.length !== 8) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function oklchToSrgb(L, C, Hdeg) {
  const h = (Hdeg * Math.PI) / 180;
  const a = C * Math.cos(h), b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const lin = [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
  return lin.map((c) => {
    const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(Math.max(c, 0), 1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, v)) * 255);
  });
}
function parseColor(v) {
  if (!v) return null;
  const s = String(v).trim().toLowerCase();
  if (s === "white") return [255, 255, 255];
  if (s === "black") return [0, 0, 0];
  if (s.startsWith("#")) return srgbFromHex(s);
  let m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  if (m) return [+m[1], +m[2], +m[3]].map(Math.round);
  m = s.match(/^oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)/);
  if (m) {
    const L = s.includes("%") && /^oklch\(\s*[\d.]+%/.test(s) ? +m[1] / 100 : +m[1];
    return oklchToSrgb(L, +m[2], +m[3]);
  }
  return null; // lab(), color(), hsl() with relative syntax, currentColor: unresolvable
}
function wcagRatio(fg, bg) {
  const lum = (c) => {
    const [r, g, b] = c.map((v) => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const a = lum(fg), b = lum(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
// APCA W3 0.1.9. Returns a signed Lc; the sign says which polarity, the magnitude
// says how legible. Unlike a WCAG ratio it accounts for polarity, which is exactly
// where WCAG 2 misjudges light text on dark grounds.
function apcaLc(txt, bg) {
  const Y = (c) => 0.2126729 * Math.pow(c[0] / 255, 2.4)
                 + 0.7151522 * Math.pow(c[1] / 255, 2.4)
                 + 0.0721750 * Math.pow(c[2] / 255, 2.4);
  let Ytxt = Y(txt), Ybg = Y(bg);
  Ytxt = Ytxt > 0.022 ? Ytxt : Ytxt + Math.pow(0.022 - Ytxt, 1.414);
  Ybg  = Ybg  > 0.022 ? Ybg  : Ybg  + Math.pow(0.022 - Ybg,  1.414);
  if (Math.abs(Ybg - Ytxt) < 0.0005) return 0;
  let out;
  if (Ybg > Ytxt) {
    const sapc = (Math.pow(Ybg, 0.56) - Math.pow(Ytxt, 0.57)) * 1.14;
    out = sapc < 0.1 ? 0 : sapc - 0.027;
  } else {
    const sapc = (Math.pow(Ybg, 0.65) - Math.pow(Ytxt, 0.62)) * 1.14;
    out = sapc > -0.1 ? 0 : sapc + 0.027;
  }
  return out * 100;
}

/* ---------------------------------------------------------- CSS block scan - */
/* A light scanner that yields the enclosing selector for each declaration.
   Selector-scoped checks (body leading, uppercase on running text) need it;
   guessing from line proximity is what makes that class of check unreliable. */

const BODY_SEL = /(^|[\s,>+~])(body|p|li|dd|blockquote|figcaption|td)\b|\.(prose|copy|content|paragraph|lead|description|excerpt|article|body-text|rich-text)\b/i;
const HEADING_SEL = /(^|[\s,>+~])h[1-6]\b|\.(h[1-6]|display|headline|hero|title|heading)\b/i;
const CONTROL_SEL = /(^|[\s,>+~])(button|input|textarea|select|a)\b|\[role=["']?button|\.(btn|button|link|chip|tag|icon-button)\b/i;
const CARD_SEL = /\.(card|panel|tile|box)\b/i;

function cssBlocks(lines) {
  const out = [];
  const stack = [];
  let pendingSel = "";
  const deepest = () => stack.filter((s) => s && !s.startsWith("@")).slice(-1)[0] ?? "";
  lines.forEach((raw, i) => {
    // strip comments crudely; enough for selector detection
    const line = raw.replace(/\/\*.*?\*\//g, "");
    // A rule opened and closed on one line - `p { line-height: 1.2 }` - has an empty
    // stack by the end of it. Record the deepest selector seen at any point during
    // the line, not the one left standing after it, or every single-line rule reads
    // as unscoped and every selector-scoped check silently never fires.
    let seen = deepest();
    let idx = 0;
    while (idx < line.length) {
      const open = line.indexOf("{", idx);
      const close = line.indexOf("}", idx);
      if (open !== -1 && (close === -1 || open < close)) {
        stack.push((pendingSel + line.slice(idx, open)).trim());
        pendingSel = "";
        idx = open + 1;
        const d = deepest();
        if (d) seen = d;
      } else if (close !== -1) {
        const d = deepest();
        if (d && !seen) seen = d;
        stack.pop();
        pendingSel = "";
        idx = close + 1;
      } else {
        if (stack.length === 0) pendingSel += line.slice(idx);
        break;
      }
    }
    out[i] = seen;
  });
  return out; // deepest selector in force anywhere on each line
}

// Lines inside a prefers-reduced-motion block. The kill-switch idiom
// `* { transition-duration: 0.01ms !important }` is the correct answer to the craft
// floor's motion rule, and flagging it against the project's motion scale is the
// kind of false positive that gets a linter switched off.
function reducedMotionRegions(lines) {
  const out = [];
  let depth = 0, inside = false;
  lines.forEach((raw, i) => {
    const line = raw.replace(/\/\*.*?\*\//g, "");
    if (!inside && /@media[^{]*prefers-reduced-motion/i.test(line)) { inside = true; depth = 0; }
    out[i] = inside;
    if (inside) {
      depth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      if (depth <= 0 && /\}/.test(line)) inside = false;
    }
  });
  return out;
}

/* ------------------------------------------------------------------ checks - */

let anyAnimation = false;
let anyReducedMotion = false;
let firstAnimatedFile = null;
let firstAnimatedLine = 1;
const census = {
  colorLiterals: 0, spaceLiterals: 0, fontSizeLiterals: 0,
  families: new Set(), radii: new Set(), shadows: new Set(), zIndexes: new Set(),
  perFile: new Map(),
};
function bump(file, n = 1) {
  census.perFile.set(file, (census.perFile.get(file) ?? 0) + n);
}

function checkFile(file) {
  let text;
  try { text = readFileSync(file, "utf8"); } catch { return; }
  const lines = text.split(/\r?\n/);
  const styleish = /\.(css|scss|astro|svelte|vue|html|jsx|tsx)$/.test(file);
  const markupish = /\.(html|astro|svelte|vue|jsx|tsx)$/.test(file);
  const cssish = /\.(css|scss)$/.test(file);
  const selectors = cssish ? cssBlocks(lines) : [];
  const reducedMotion = cssish ? reducedMotionRegions(lines) : [];

  if (/prefers-reduced-motion/.test(text)) anyReducedMotion = true;
  if (/@keyframes|\banimation\s*:|\btransition\s*:/.test(text)) anyAnimation = true;

  // --- per-line checks ---
  lines.forEach((raw, idx) => {
    const n = idx + 1;
    const line = raw;
    const sel = selectors[idx] ?? "";
    const inReducedMotion = reducedMotion[idx] === true;

    /* ---- system: the project's own declarations ---- */

    // banned typefaces, and the fallback stack
    // Capture through quotes: [^;}"'] stopped at the first quote mark, so every
    // quoted family - which is most of them - went unchecked entirely.
    const fam = line.match(/font-family\s*:\s*([^;}]+)/i);
    if (fam) {
      const value = fam[1];
      census.families.add(value.split(",")[0].trim().replace(/["']/g, "").toLowerCase());
      // Only the primary face is judged. A refused face is refused as a *choice*; as the
      // last generic in a fallback stack it is doing exactly what the craft floor asks for,
      // and flagging it there would put two of this tool's own rules in direct contradiction.
      if (enabled("banned-fonts") && cfg.fonts.banned?.length) {
        const primary = value.split(",")[0].trim().replace(/["']/g, "");
        for (const bad of cfg.fonts.banned) {
          if (primary.toLowerCase() !== bad.toLowerCase()) continue;
          if (suppressed(line, "banned-fonts", file, n)) continue;
          report("banned-fonts", file, n,
            `"${bad}" as the primary face; this project decided against it. If the brief earns it ` +
            `back, take it out of fonts.banned and record why as a kind-B licence`);
        }
      }
      if (enabled("font-no-fallback") && !/var\(|inherit|initial|unset/.test(value)) {
        const families = value.split(",").map((s) => s.trim()).filter(Boolean);
        const generic = /\b(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-serif|ui-sans-serif|ui-monospace|ui-rounded)\b/i;
        if (families.length === 1 && !generic.test(value) && !suppressed(line, "font-no-fallback", file, n)) {
          report("font-no-fallback", file, n,
            `"${families[0].replace(/["']/g, "")}" declared with no fallback stack; a silent fallback renders in something nobody chose`);
        }
      }
    }

    // colour literals outside the token files
    if (styleish && !isTokenFile(file)) {
      const colors = [
        ...[...line.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0]),
        ...[...line.matchAll(/\b(?:rgba?|hsla?|oklch|lab)\([^)]*\)/g)].map((m) => m[0]),
      ];
      for (const c of colors) {
        if (/^#[0-9a-fA-F]{6}$/.test(c) && /url\(|content\s*:/.test(line)) continue;
        if (cfg.palette.some((p) => p.toLowerCase() === c.toLowerCase())) continue;
        census.colorLiterals++; bump(file);
        if (enabled("color-literal") && !suppressed(line, "color-literal", file, n)) {
          report("color-literal", file, n, `colour literal ${c} outside the token layer; use a token`);
        }
      }
    }

    // spacing off the declared scale
    const spaceDecl = line.match(/\b(padding|margin|gap|row-gap|column-gap)(-(top|right|bottom|left|inline|block))?\s*:\s*([^;}]+)/i);
    if (styleish && !isTokenFile(file) && spaceDecl) {
      const value = spaceDecl[4];
      if (!/var\(|calc\(|clamp\(|min\(|max\(/.test(value)) {
        for (const l of lengthsIn(value)) {
          const px = toPx(l);
          if (px === null || px === 0) continue;
          if (spaceScale && spaceScale.has(px)) continue;
          if (!spaceScale) { census.spaceLiterals++; bump(file); continue; }
          census.spaceLiterals++; bump(file);
          if (enabled("space-literal") && !suppressed(line, "space-literal", file, n)) {
            report("space-literal", file, n, `${l.raw} is off the declared spacing scale`);
          }
        }
      }
    }

    // font-size: off the declared scale, and below the legible floor
    const fsDecl = line.match(/\bfont-size\s*:\s*([^;}]+)/i);
    if (styleish && fsDecl && !/var\(|clamp\(|calc\(/.test(fsDecl[1])) {
      for (const l of lengthsIn(fsDecl[1])) {
        const px = toPx(l);
        if (px === null) continue;

        if (enabled("tiny-text") && px > 0 && px < 11 && !suppressed(line, "tiny-text", file, n)) {
          report("tiny-text", file, n,
            `${l.raw} is below the legible floor; functional text stays at 11px or above, body at 14px or above`);
        }
        if (enabled("input-font-size") && px < 16 && CONTROL_SEL.test(sel) && /input|textarea|select/i.test(sel)
            && !suppressed(line, "input-font-size", file, n)) {
          report("input-font-size", file, n,
            `${l.raw} on an input; below 16px iOS zooms the viewport on focus and the approved layout is not the one shipped`);
        }
        if (!isTokenFile(file)) {
          if (fontScale && fontScale.has(px)) continue;
          census.fontSizeLiterals++; bump(file);
          if (fontScale && enabled("font-size-literal") && !suppressed(line, "font-size-literal", file, n)) {
            report("font-size-literal", file, n, `${l.raw} is off the declared type scale`);
          }
        }
      }
    }

    // border-radius
    const radDecl = line.match(/\bborder-radius\s*:\s*([^;}]+)/i);
    if (styleish && radDecl && !/var\(|calc\(/.test(radDecl[1])) {
      for (const l of lengthsIn(radDecl[1])) {
        const px = toPx(l);
        if (px === null || px === 0) continue;
        census.radii.add(l.raw);
        if (radiusScale && !radiusScale.has(px) && !isTokenFile(file)
            && enabled("radius-literal") && !suppressed(line, "radius-literal", file, n)) {
          report("radius-literal", file, n, `${l.raw} is off the declared radius scale`);
        }
      }
    }

    // border width. Edge weight is one of the two carriers of a material language
    // and elevation is the other, so a project that committed to hairline rules or
    // to a heavy border needs this checked or section four quietly disagrees.
    //
    // `outline` is deliberately NOT read here. A focus ring is craft floor, its
    // weight is not the idiom's business, and flagging it would put two of this
    // tool's own rules in direct opposition.
    // A line may carry more than one edge declaration, and `border: 3px solid
    // var(--rule)` is the commonest real shape, so the value is stripped of its
    // var() and calc() parts rather than skipped whole: the colour comes from a
    // token, the weight is still a literal, and the weight is what is judged.
    if (styleish && borderWidthScale && !isTokenFile(file)) {
      const bwDecls = line.matchAll(/\bborder(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?(?:-width)?\s*:\s*([^;}]+)/gi);
      for (const d of bwDecls) {
        const value = d[1].replace(/(?:var|calc|clamp|min|max)\([^)]*\)/gi, " ");
        for (const l of lengthsIn(value)) {
          const px = toPx(l);
          if (px === null || px === 0 || borderWidthScale.has(px)) continue;
          if (enabled("border-width-literal") && !suppressed(line, "border-width-literal", file, n)) {
            report("border-width-literal", file, n, `${l.raw} is off the declared edge scale`);
          }
        }
      }
    }

    // box-shadow
    const shDecl = line.match(/\bbox-shadow\s*:\s*([^;}]+)/i);
    if (styleish && shDecl && !/var\(|none/i.test(shDecl[1])) {
      const v = normaliseShadow(shDecl[1]);
      census.shadows.add(v);
      if (shadowScale && !shadowScale.has(v) && !isTokenFile(file)
          && enabled("shadow-literal") && !suppressed(line, "shadow-literal", file, n)) {
        report("shadow-literal", file, n, `shadow is outside the declared elevation set`);
      }
    }

    // z-index
    const zDecl = line.match(/\bz-index\s*:\s*(-?\d+)\b/i);
    if (styleish && zDecl) {
      census.zIndexes.add(zDecl[1]);
      if (zIndexScale && !zIndexScale.has(Number(zDecl[1])) && !isTokenFile(file)
          && enabled("z-index-literal") && !suppressed(line, "z-index-literal", file, n)) {
        report("z-index-literal", file, n,
          `z-index ${zDecl[1]} is off the declared layer scale; an ad-hoc z-index is how stacking stops being predictable`);
      }
    }

    // duration
    const durDecl = line.match(/\b(?:transition-duration|animation-duration)\s*:\s*([^;}]+)/i)
                 || line.match(/\btransition\s*:\s*[^;}]*?(\d*\.?\d+m?s)\b/i);
    if (styleish && durationSet && durDecl && !isTokenFile(file) && !inReducedMotion && !/var\(/.test(durDecl[0])) {
      const found = [...durDecl[0].matchAll(/(\d*\.?\d+m?s)\b/g)].map((m) => m[1].toLowerCase());
      for (const d of found) {
        if (durationSet.has(d)) continue;
        if (enabled("duration-literal") && !suppressed(line, "duration-literal", file, n)) {
          report("duration-literal", file, n, `${d} is off the declared motion scale`);
        }
      }
    }

    /* ---- floor: craft ---- */

    if (enabled("transition-all") && styleish) {
      if (/\btransition(-property)?\s*:\s*(?:[^;}]*\s)?all\b/i.test(line) && !suppressed(line, "transition-all", file, n)) {
        report("transition-all", file, n, "transition: all animates properties nobody chose, including ones added later; list them");
      }
    }

    if (enabled("animate-layout") && styleish && !inReducedMotion) {
      const t = line.match(/\btransition(-property)?\s*:\s*([^;}]+)/i);
      if (t) {
        const bad = ["width", "height", "top", "right", "bottom", "left", "margin", "padding"]
          .filter((p) => new RegExp(`(^|[,\\s])${p}([,\\s]|$)`).test(t[2]));
        if (bad.length && !suppressed(line, "animate-layout", file, n)) {
          report("animate-layout", file, n, `animating layout property ${bad.join(", ")} forces reflow every frame; animate transform/opacity`);
        }
      }
    }

    // leading on running text
    const lhDecl = line.match(/\bline-height\s*:\s*(\d*\.?\d+)\s*[;}]/i);
    if (enabled("line-height-body") && cssish && lhDecl && BODY_SEL.test(sel) && !HEADING_SEL.test(sel)) {
      const v = parseFloat(lhDecl[1]);
      if (v > 0 && v < 1.3 && !suppressed(line, "line-height-body", file, n)) {
        report("line-height-body", file, n,
          `line-height ${v} on running text; under 1.3 the eye cannot find the next line`, { heuristic: true });
      }
    }

    // measure
    const mw = line.match(/\bmax-width\s*:\s*(\d*\.?\d+)ch\b/i);
    if (enabled("measure") && styleish && mw) {
      const ch = parseFloat(mw[1]);
      const { minCh, maxCh } = cfg.measure;
      if ((ch > maxCh || ch < minCh) && !suppressed(line, "measure", file, n)) {
        report("measure", file, n,
          `measure of ${ch}ch is outside ${minCh}-${maxCh}ch; beyond that the eye loses the return sweep`);
      }
    }

    if (enabled("justified-no-hyphens") && styleish && /\btext-align\s*:\s*justify\b/i.test(line)) {
      if (!/hyphens\s*:\s*auto/i.test(text) && !suppressed(line, "justified-no-hyphens", file, n)) {
        report("justified-no-hyphens", file, n,
          "justified text with no hyphens: auto in this file opens rivers of white between words");
      }
    }

    if (enabled("all-caps-body") && cssish && /\btext-transform\s*:\s*uppercase\b/i.test(line)
        && BODY_SEL.test(sel) && !suppressed(line, "all-caps-body", file, n)) {
      report("all-caps-body", file, n,
        "uppercase on running text; word shape comes from ascenders and descenders and uppercase removes both",
        { heuristic: true });
    }

    const lsDecl = line.match(/\bletter-spacing\s*:\s*(-?\d*\.?\d+)(em|rem|px)\b/i);
    if (styleish && lsDecl) {
      const v = parseFloat(lsDecl[1]);
      const em = lsDecl[2] === "em" ? v : lsDecl[2] === "rem" ? v : v / cfg.rootFontSizePx;
      if (enabled("wide-tracking-body") && em > 0.05 && BODY_SEL.test(sel) && !/label|eyebrow|kicker|caps|overline/i.test(sel)
          && !suppressed(line, "wide-tracking-body", file, n)) {
        report("wide-tracking-body", file, n,
          `letter-spacing ${lsDecl[0].split(":")[1].trim()} on body text breaks the grouping of letters into words`,
          { heuristic: true });
      }
      if (enabled("crushed-tracking") && em < -0.04 && !suppressed(line, "crushed-tracking", file, n)) {
        report("crushed-tracking", file, n,
          `letter-spacing ${lsDecl[0].split(":")[1].trim()} is past the point where characters keep their own shapes`);
      }
    }

    // hit targets
    const dim = line.match(/\b(width|height|min-width|min-height)\s*:\s*(\d*\.?\d+)(px|rem)\b/i);
    if (enabled("tap-target") && cssish && dim && CONTROL_SEL.test(sel)) {
      const px = toPx({ n: parseFloat(dim[2]), unit: dim[3].toLowerCase() });
      if (px !== null && px > 0 && px < 24 && !/icon|svg|dot|badge|indicator/i.test(sel)
          && !suppressed(line, "tap-target", file, n)) {
        report("tap-target", file, n,
          `${dim[0].split(":")[1].trim()} on an interactive element; a target smaller than 24px is not a target`,
          { heuristic: true });
      }
    }

    // full-viewport section
    if (enabled("viewport-height-hero") && styleish
        && /\b(min-height|height)\s*:\s*100(vh|dvh|svh|lvh)\b/i.test(line)
        && !/\bhtml\b|\bbody\b|#root|#__next/i.test(sel)
        && !suppressed(line, "viewport-height-hero", file, n)) {
      report("viewport-height-hero", file, n,
        "a full-viewport section pushes the page out of the first frame; size it to what it holds");
    }

    // gradient clipped to text
    if (enabled("gradient-text") && styleish
        && /background-clip\s*:\s*text|-webkit-background-clip\s*:\s*text/i.test(line)
        && !suppressed(line, "gradient-text", file, n)) {
      report("gradient-text", file, n,
        "gradient clipped to text is decoration standing in for emphasis; carry it with weight, size or colour");
    }

    // viewport zoom
    if (enabled("zoom-disabled") && markupish
        && /<meta[^>]*viewport[^>]*(user-scalable\s*=\s*["']?no|maximum-scale\s*=\s*["']?1)/i.test(line)
        && !suppressed(line, "zoom-disabled", file, n)) {
      report("zoom-disabled", file, n,
        "browser zoom disabled; it is the only accommodation some readers have");
    }

    // action on a non-interactive element
    if (enabled("div-onclick") && markupish
        && /<(div|span|li|td)\b[^>]*\son(Click|MouseDown)\s*=/i.test(line)
        && !/role\s*=\s*["'](button|link|tab|menuitem)/i.test(line)
        && !suppressed(line, "div-onclick", file, n)) {
      report("div-onclick", file, n,
        "click handler on a non-interactive element; use <button> or <a> so keyboard, cmd-click and assistive technology work");
    }

    // nested cards, from the selector itself
    if (enabled("nested-cards") && cssish) {
      const m = line.match(/^([^{}]*?)\{/);
      if (m) {
        const s = m[1];
        const hits = [...s.matchAll(/\.(card|panel|tile)\b/gi)];
        if (hits.length >= 2 && /\s/.test(s.slice(hits[0].index, hits[1].index))
            && !suppressed(line, "nested-cards", file, n)) {
          report("nested-cards", file, n,
            `"${s.trim()}" styles a card inside a card; flatten with spacing, type and rules`);
        }
      }
    }
  });

  /* ---- file-level checks ---- */

  // outline: none with no focus-visible replacement anywhere in the file
  if (enabled("outline-none") && styleish) {
    const offenders = [];
    lines.forEach((l, i) => {
      if (/\boutline\s*:\s*(none|0)\b/i.test(l) && !SUPPRESS.test(l)) offenders.push(i + 1);
    });
    if (offenders.length && !/:focus-visible|:focus-within|\bfocus-visible:/.test(text)) {
      for (const n of offenders) {
        report("outline-none", file, n, "outline removed with no :focus-visible replacement in this file");
      }
    }
  }

  // images
  if (markupish) {
    lines.forEach((l, i) => {
      const n = i + 1;
      for (const m of l.matchAll(/<img\b([^>]*)>/gi)) {
        const attrs = m[1];
        if (enabled("img-empty-src")
            && /\bsrc\s*=\s*["'](\s*|#|placeholder|about:blank|TODO)["']/i.test(attrs)
            && !suppressed(l, "img-empty-src", file, n)) {
          report("img-empty-src", file, n, "image with an empty or placeholder src ships as a broken-image box");
        }
        if (enabled("img-no-alt") && !/\balt\s*=/.test(attrs) && !suppressed(l, "img-no-alt", file, n)) {
          report("img-no-alt", file, n, "image with no alt; decorative images take alt=\"\"");
        }
        if (enabled("img-no-dimensions")
            && !(/\bwidth\s*=/.test(attrs) && /\bheight\s*=/.test(attrs))
            && !/\bfill\b|aspect-ratio/.test(attrs)
            && !suppressed(l, "img-no-dimensions", file, n)) {
          report("img-no-dimensions", file, n,
            "image with no width and height; the reserved box is what stops the button moving as the reader reaches for it",
            { heuristic: true });
        }
      }
    });
  }

  // heading order
  if (enabled("heading-skip") && markupish) {
    let last = 0;
    lines.forEach((l, i) => {
      for (const m of l.matchAll(/<h([1-6])\b/gi)) {
        const lvl = Number(m[1]);
        if (last && lvl > last + 1 && !suppressed(l, "heading-skip", file, i + 1)) {
          report("heading-skip", file, i + 1,
            `h${lvl} follows h${last}; the outline is the document's table of contents for anyone who cannot see the page`);
        }
        last = lvl;
      }
    });
  }

  // a token whose only definition sits inside a theme or media block
  if (enabled("theme-only-token") && cssish) {
    const bare = new Set();
    const scoped = new Map();
    const stack = [];
    lines.forEach((l, i) => {
      const opens = (l.match(/\{/g) || []).length;
      const closes = (l.match(/\}/g) || []).length;
      if (opens) {
        const isScoped = /@media|@supports|\[data-theme|:root\s*:not\(/.test(l);
        for (let k = 0; k < opens; k++) stack.push(isScoped && k === 0);
      }
      const inScoped = stack.some(Boolean);
      for (const m of l.matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)) {
        if (inScoped) { if (!scoped.has(m[1])) scoped.set(m[1], i + 1); }
        else bare.add(m[1]);
      }
      for (let k = 0; k < closes; k++) stack.pop();
    });
    for (const [tok, n] of scoped) {
      if (!bare.has(tok) && !SUPPRESS.test(lines[n - 1] ?? "")) {
        report("theme-only-token", file, n, `${tok} is defined only inside a theme or media block; declare it in bare :root first`);
      }
    }
  }

  // content at rest with opacity 0 - heuristic, and labelled as one
  if (enabled("rest-opacity-zero") && styleish) {
    const inKeyframes = [];
    let kf = 0;
    lines.forEach((l, i) => {
      if (/@keyframes/.test(l)) kf = 1;
      if (kf) { inKeyframes[i] = true; kf += (l.match(/\{/g) || []).length - (l.match(/\}/g) || []).length; if (kf <= 0) kf = 0; }
    });
    const enclosingSelector = (i) => {
      for (let k = i; k >= 0; k--) {
        const m = lines[k].match(/^([^{}]*?)\{/);
        if (m && m[1].trim()) return m[1].trim();
      }
      return "";
    };
    lines.forEach((l, i) => {
      if (inKeyframes[i]) return;
      if (!/\bopacity\s*:\s*0(\.0+)?\s*[;}]/.test(l)) return;
      const sel = enclosingSelector(i);
      if (/:hover|:focus|:active|\[hidden\]|\[aria-hidden|\.is-hidden/.test(sel)) return;
      const names = [...sel.matchAll(/[.#]([A-Za-z0-9_-]+)/g)].map((m) => m[1]);
      const revealed = names.some((n) =>
        new RegExp(`[.#]${escapeRe(n)}\\b[^{}]*(:hover|:focus)|(:hover|:focus)[^{}]*[.#]${escapeRe(n)}\\b`).test(text));
      if (revealed) return;
      if (/display\s*:\s*none/.test(lines.slice(Math.max(0, i - 4), i + 4).join(" "))) return;
      if (suppressed(l, "rest-opacity-zero", file, i + 1)) return;
      report("rest-opacity-zero", file, i + 1,
        "element may rest at opacity 0 waiting for an observer; the first frame must be readable",
        { heuristic: true });
    });
  }

  // banned copy words in visible text
  if (enabled("banned-copy") && cfg.bannedCopy.length && /\.(html|astro|svelte|vue|jsx|tsx|md|mdx)$/.test(file)) {
    lines.forEach((l, i) => {
      for (const w of cfg.bannedCopy) {
        const re = new RegExp(`\\b${escapeRe(w)}\\b`, "i");
        if (re.test(l) && !suppressed(l, "banned-copy", file, i + 1)) {
          report("banned-copy", file, i + 1, `banned copy word "${w}"`);
        }
      }
    });
  }

  // generated-copy cadence, in prose files only
  if (enabled("copy-cadence") && /\.(md|mdx|html|astro|jsx|tsx|svelte|vue)$/.test(file)) {
    lines.forEach((l, i) => {
      const n = i + 1;
      const prose = l.replace(/<[^>]+>/g, " ");
      const dashes = (prose.match(/—/g) || []).length;
      if (dashes > 2 && !suppressed(l, "copy-cadence", file, n)) {
        report("copy-cadence", file, n,
          `${dashes} em dashes in one line; more than a couple in body copy is a cadence tell. Commas, colons, periods, parentheses`);
      }
      if (/\b(?:It'?s not|Not) [^.!?]{2,40}[.!?]\s*(?:It'?s|Just|It is) [^.!?]{2,40}[.!?]/i.test(prose)
          && !suppressed(l, "copy-cadence", file, n)) {
        report("copy-cadence", file, n,
          "manufactured-contrast cadence (\"Not X. Just Y.\"); once is voice, repeated it is the tell");
      }
      if (/\btheater\b/i.test(prose) && !suppressed(l, "copy-cadence", file, n)) {
        report("copy-cadence", file, n,
          "\"theater\" framing is a generated-copy tic; say what the thing does or does not do");
      }
    });
  }

  // evidence the truth ledger forbids
  if (enabled("forbidden-evidence") && cfg.forbiddenEvidence.length) {
    lines.forEach((l, i) => {
      for (const pat of cfg.forbiddenEvidence) {
        let re;
        try { re = new RegExp(pat, "i"); } catch { continue; }
        if (re.test(l) && !suppressed(l, "forbidden-evidence", file, i + 1)) {
          report("forbidden-evidence", file, i + 1,
            `matches forbidden evidence pattern /${pat}/ - the truth ledger says this does not exist`);
        }
      }
    });
  }
}

targets.forEach(checkFile);

/* -------------------------------------------------- project-level checks - */

// Motion exists somewhere and nothing anywhere honours prefers-reduced-motion.
// Project-level on purpose: the branch belongs once, not per file.
if (enabled("reduced-motion") && anyAnimation && !anyReducedMotion && (opts.all || opts.changed)) {
  report("reduced-motion", firstAnimatedFile ?? targets[0] ?? ".", firstAnimatedLine,
    "the project animates and no file honours prefers-reduced-motion; for some readers motion is not decoration");
}

// A declared idiom assertion the source never realises. The pattern is written by
// the project at gate 3, against source the project also wrote, so there is no
// heuristic here and nothing to guess: a project that declares nothing is checked
// for nothing. This is the only mechanical half of the idiom - where the signature
// recurs, whether it recurs enough and whether it reads as one are rendered-layout
// judgements and belong to gate 6.
// `--all` only, deliberately. This counts across the project, so running it over
// the subset a hook or a --changed run sees would report every signature as
// missing from the one file being edited. A finding nobody can act on is how a
// linter gets switched off.
if (enabled("idiom-unrealised") && opts.all) {
  const assertions = [
    ...(Array.isArray(cfg.nonNegotiables) ? cfg.nonNegotiables.map((a) => ({ ...a, kind: "non-negotiable" })) : []),
    ...(cfg.signature ? [{ ...cfg.signature, claim: cfg.signature.what, kind: "signature" }] : []),
  ].filter((a) => typeof a?.pattern === "string" && a.pattern.trim());

  for (const a of assertions) {
    let re;
    try { re = new RegExp(a.pattern, "i"); }
    catch {
      report("idiom-unrealised", targets[0] ?? ".", 1,
        `${a.kind} "${a.claim ?? a.id ?? a.pattern}" has a pattern that is not a valid regex: ${a.pattern}`);
      continue;
    }
    const min = Number.isInteger(a.min) && a.min > 0 ? a.min : 1;
    let hits = 0;
    for (const file of targets) {
      if (isTokenFile(file)) continue;
      let text; try { text = readFileSync(file, "utf8"); } catch { continue; }
      for (const line of text.split(/\r?\n/)) if (re.test(line)) hits++;
      if (hits >= min) break;
    }
    if (hits < min) {
      report("idiom-unrealised", targets[0] ?? ".", 1,
        `the declared ${a.kind} "${a.claim ?? a.id ?? a.pattern}" matches ${hits} line(s), below the ${min} it declares; `
        + `it was decided at gate 3 and the build did not carry it`);
    }
  }
}

/* -------------------------------------------------------- token contrast - */
/* Resolves the declared token pairs in both themes and computes WCAG 2 and APCA
   against the target chosen at E7. Exact arithmetic on declared values - the one
   part of the craft floor that can be gated in CI without a browser. */

function collectTokens() {
  const light = new Map(), dark = new Map();
  for (const file of walk(CWD)) {
    if (!/\.(css|scss)$/.test(file)) continue;
    if (cfg.tokenFiles.length && !isTokenFile(file)) continue;
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    const stack = [];
    lines.forEach((l) => {
      const opens = (l.match(/\{/g) || []).length;
      const closes = (l.match(/\}/g) || []).length;
      if (opens) {
        const isDark = /prefers-color-scheme\s*:\s*dark|\[data-theme\s*=\s*["']?dark/.test(l);
        for (let k = 0; k < opens; k++) stack.push(isDark && k === 0);
      }
      const inDark = stack.some(Boolean);
      for (const m of l.matchAll(/(--[A-Za-z0-9_-]+)\s*:\s*([^;}]+)/g)) {
        (inDark ? dark : light).set(m[1], m[2].trim());
      }
      for (let k = 0; k < closes; k++) stack.pop();
    });
  }
  return { light, dark };
}

function resolveToken(name, map, fallbackMap, depth = 0) {
  if (depth > 10) return null;
  let v = map.get(name) ?? fallbackMap?.get(name);
  if (!v) return null;
  const m = v.match(/var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,\s*([^)]+))?\)/);
  if (m) {
    const inner = resolveToken(m[1], map, fallbackMap, depth + 1);
    if (inner) return inner;
    return m[2] ? parseColor(m[2].trim()) : null;
  }
  return parseColor(v);
}

const WCAG_TARGET = { body: 4.5, large: 3, ui: 3 };
const APCA_TARGET = { body: 75, large: 60, ui: 45 };

if (enabled("token-contrast") && Array.isArray(cfg.contrast.pairs) && cfg.contrast.pairs.length) {
  const { light, dark } = collectTokens();
  const mode = (cfg.contrast.algorithm ?? "wcag").toLowerCase(); // wcag | apca | both
  const level = (cfg.contrast.level ?? "AA").toUpperCase();
  const bump = level === "AAA" ? 1.5 : 0;

  for (const pair of cfg.contrast.pairs) {
    const role = pair.role ?? "body";
    for (const [themeName, map] of [["light", light], ["dark", dark]]) {
      if (themeName === "dark" && dark.size === 0) continue;
      const fg = resolveToken(pair.fg, map, themeName === "dark" ? light : null);
      const bg = resolveToken(pair.bg, map, themeName === "dark" ? light : null);
      const where = pair.file ?? (cfg.tokenFiles[0] ?? "tokens.css");
      if (!fg || !bg) {
        report("token-contrast", where, 1,
          `${pair.fg} on ${pair.bg} (${themeName}) could not be resolved to a colour; ` +
          `state it as a literal in the token layer or verify it visually and say so in the parity report`,
          { heuristic: true });
        continue;
      }
      if (mode === "wcag" || mode === "both") {
        const r = wcagRatio(fg, bg);
        const need = WCAG_TARGET[role] + bump;
        if (r < need) {
          report("token-contrast", where, 1,
            `${pair.fg} on ${pair.bg} (${themeName}, ${role}) is ${r.toFixed(2)}:1, below WCAG ${level} ${need}:1`);
        }
      }
      if (mode === "apca" || mode === "both") {
        const lc = Math.abs(apcaLc(fg, bg));
        const need = APCA_TARGET[role];
        if (lc < need) {
          report("token-contrast", where, 1,
            `${pair.fg} on ${pair.bg} (${themeName}, ${role}) is Lc ${lc.toFixed(1)}, below the APCA floor of ${need}`);
        }
      }
    }
  }
}

/* ------------------------------------------------------------------ census - */

if (opts.census) {
  const top = [...census.perFile.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const out = {
    checked: targets.length,
    colourLiterals: census.colorLiterals,
    spacingLiterals: census.spaceLiterals,
    fontSizeLiterals: census.fontSizeLiterals,
    distinctFamilies: [...census.families].sort(),
    distinctRadii: [...census.radii].sort(),
    distinctShadows: census.shadows.size,
    distinctZIndexes: [...census.zIndexes].sort((a, b) => a - b),
    worstFiles: top.map(([f, n]) => ({ file: f, literals: n })),
    craftFloorFindings: findings.length,
  };
  if (opts.json) {
    process.stdout.write(JSON.stringify(out, null, 2) + "\n");
  } else {
    const row = (k, v) => process.stdout.write(`  ${k.padEnd(26)} ${v}\n`);
    process.stdout.write(`\nBaseline census - ${targets.length} file(s)\n\n`);
    row("Colour literals", out.colourLiterals);
    row("Spacing literals", out.spacingLiterals);
    row("Font-size literals", out.fontSizeLiterals);
    row("Distinct font families", out.distinctFamilies.length + (out.distinctFamilies.length ? `  ${out.distinctFamilies.join(", ")}` : ""));
    row("Distinct border radii", out.distinctRadii.length + (out.distinctRadii.length ? `  ${out.distinctRadii.join(", ")}` : ""));
    row("Distinct shadows", out.distinctShadows);
    row("Distinct z-indexes", out.distinctZIndexes.length);
    row("Craft-floor findings", out.craftFloorFindings);
    if (top.length) {
      process.stdout.write(`\n  Most literals:\n`);
      for (const [f, n] of top) process.stdout.write(`    ${String(n).padStart(5)}  ${f}\n`);
    }
    process.stdout.write(
      `\nThis is the number the refactor is measured against. Run it again after the\n` +
      `token layer lands; a refactor with no number attached is indistinguishable from\n` +
      `one that did nothing.\n`);
  }
  process.exit(0);
}

/* ---------------------------------------------------------------- baseline - */

const key = (f) => `${f.id}::${f.file}::${f.message}`;

if (opts.writeBaseline) {
  writeFileSync(BASELINE_PATH, JSON.stringify({
    recorded: new Date().toISOString(),
    note: "Accepted findings. CI gates only on findings absent from this list. This is a to-do, not a permission.",
    accepted: findings.map(key).sort(),
  }, null, 2) + "\n");
  process.stdout.write(`ptah-check: recorded ${findings.length} finding(s) as baseline in ${norm(BASELINE_PATH)}\n`);
  process.exit(0);
}

let active = findings;
let baselined = 0;
if (opts.baseline && existsSync(BASELINE_PATH)) {
  try {
    const accepted = new Set(JSON.parse(readFileSync(BASELINE_PATH, "utf8")).accepted ?? []);
    active = findings.filter((f) => !accepted.has(key(f)));
    baselined = findings.length - active.length;
  } catch (e) { die(`could not parse baseline: ${e.message}`); }
}

/* ------------------------------------------------------------------ output - */

const CANNOT_SEE = "Static check only. It cannot judge composition, hierarchy, or whether the design works. A clean run is not evidence that the design is right - the visual and parity loops decide that.";

// PostToolUse: a violation goes straight back to the agent as a blocking reason, so it
// corrects itself with no human in the loop. Exit 0 either way - the JSON carries the
// decision, and exit 2 would bypass the reason text.
if (hookMode === "post-tool-use") {
  if (!active.length) process.exit(0);
  const byClass = { floor: [], system: [], default: [] };
  for (const f of active) byClass[f.class].push(`  ${f.file}:${f.line}  ${f.id}  ${f.message}`);
  const part = (k, head) => byClass[k].length ? `\n${head}\n${byClass[k].join("\n")}\n` : "";
  process.stdout.write(JSON.stringify({
    decision: "block",
    reason:
      `This edit violates the project's recorded design rules (.ptah/RULES.md):\n` +
      part("floor", "CRAFT FLOOR - no brief overrules these:") +
      part("system", "PROJECT SYSTEM - the values this project declared:") +
      part("default", "REFUSED DEFAULT - licensable, if the brief earns it:") +
      `\nFix these before continuing. Every colour, size, space and typeface must resolve to a ` +
      `declared token. If a value is genuinely needed and does not exist, add it to the token ` +
      `layer and record its rule - do not inline it. A refused default can be kept only by ` +
      `writing a licence into the ledger that names the brief line earning it.`,
  }) + "\n");
  process.exit(0);
}

// FileChanged has no decision control and cannot block. Report and step aside.
if (hookMode === "file-changed") {
  if (active.length) {
    process.stderr.write(
      `ptah-check: ${active.length} design-rule violation(s) in ${hookPath} ` +
      `(written outside the edit tools, so this could not be blocked):\n` +
      active.map((f) => `  ${f.file}:${f.line}  ${f.id}  ${f.message}`).join("\n") + "\n");
  }
  process.exit(0);
}

if (opts.sarif) {
  process.stdout.write(JSON.stringify({
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [{
      tool: { driver: { name: "ptah-check", informationUri: "https://github.com/", rules: [...new Set(active.map((f) => f.id))].map((id) => ({ id, properties: { class: classOf(id) } })) } },
      results: active.map((f) => ({
        ruleId: f.id,
        level: f.heuristic ? "warning" : "error",
        message: { text: f.message + (f.source ? ` (${f.source})` : "") },
        locations: [{ physicalLocation: { artifactLocation: { uri: f.file }, region: { startLine: f.line } } }],
      })),
    }],
  }, null, 2) + "\n");
} else if (opts.json) {
  process.stdout.write(JSON.stringify({
    checked: targets.length, findings: active, suppressions, licensed, baselined,
    unusedLicences: [...licenceIndex.keys()].filter((id) => !licencesUsed.has(id)),
    invalidLicences: invalidLicences.map((l) => ({ rule: l.rule, why: `class ${classOf(l.rule)} is not licensable` })),
    limits: CANNOT_SEE,
  }, null, 2) + "\n");
} else {
  const byFile = new Map();
  for (const f of active) {
    if (!byFile.has(f.file)) byFile.set(f.file, []);
    byFile.get(f.file).push(f);
  }
  for (const [file, fs] of [...byFile.entries()].sort()) {
    for (const f of fs.sort((a, b) => a.line - b.line)) {
      const tag = f.heuristic ? " [heuristic]" : "";
      const src = f.source ? ` (${f.source})` : "";
      process.stdout.write(`${file}:${f.line}  [${f.class}] ${f.id}${tag}  ${f.message}${src}\n`);
    }
  }
  if (!opts.quiet) {
    const n = (c) => active.filter((f) => f.class === c).length;
    const ledgerRel = relative(CWD, PTAH_DIR).split(sep).join("/");
    if (ledgerRel && ledgerRel !== ".ptah") process.stdout.write(`
ledger: ${ledgerRel}
`);
    process.stdout.write(`\n${active.length} violation(s) across ${targets.length} file(s)`);
    if (active.length) process.stdout.write(`  -  floor ${n("floor")}, system ${n("system")}, default ${n("default")}`);
    if (baselined) process.stdout.write(`, ${baselined} baselined`);
    if (suppressions.length) process.stdout.write(`, ${suppressions.length} suppressed with ptah-allow`);
    if (licensed.length) process.stdout.write(`, ${licensed.length} licensed`);
    process.stdout.write(`\n`);
    if (suppressions.length) {
      process.stdout.write(`\nSuppressed (visible on purpose):\n`);
      for (const s of suppressions) process.stdout.write(`  ${s.file}:${s.line}  ${s.id}\n`);
    }
    if (licensed.length) {
      process.stdout.write(`\nLicensed defaults (each one is a decision the ledger has to justify):\n`);
      for (const s of licensed) process.stdout.write(`  ${s.file}:${s.line}  ${s.id}\n`);
    }
    const unused = [...licenceIndex.keys()].filter((id) => !licencesUsed.has(id));
    if (unused.length) {
      process.stdout.write(`\nLicences in the ledger that nothing used: ${unused.join(", ")}\n` +
        `A licence for something that is not there is a decision nobody made. Remove it.\n`);
    }
    if (invalidLicences.length) {
      process.stdout.write(`\nLicences that cannot apply:\n`);
      for (const l of invalidLicences) {
        process.stdout.write(`  ${l.rule}  -  class "${classOf(l.rule)}" is not licensable. ` +
          `The craft floor is not a matter of taste and the project's own declarations are not exceptions to themselves.\n`);
      }
    }
    process.stdout.write(`\n${CANNOT_SEE}\n`);
  }
}

process.exit(active.length ? 1 : 0);
