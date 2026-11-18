/*
 * One-off: turns the approved canvas artboard (Orbit.dc.html) into the body
 * and stylesheet of src/pages/index.astro. Kept so the port can be repeated
 * if the design is revised on the canvas. Usage:
 *   node scripts/port-orbit.mjs <Orbit.dc.html>
 */
import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync(process.argv[2], 'utf8');
let css = /<helmet>\s*<style>([\s\S]*?)<\/style>\s*<\/helmet>/.exec(src)[1];
let body = /<\/helmet>([\s\S]*?)<\/x-dc>/.exec(src)[1];

const MARK_DARK = '/brand/svipall-mark-dark.svg';
const MARK_LIGHT = '/brand/svipall-mark.svg';
const blobs = {
  '/_blob/6804dbde79b2d4acfb538ae7fa03e0db': '/fonts/archivo-variable.woff2',
  '/_blob/f35f5eeb8537a6440748daebcfdd21d9': MARK_DARK,
  '/_blob/6a7bf325c228941c05b546c6adc71258': MARK_LIGHT,
};
for (const [k, v] of Object.entries(blobs)) {
  css = css.split(k).join(v);
  body = body.split(k).join(v);
}

/* Theme: tokens keyed off <html data-theme>, which Starlight also uses. */
css = css
  .replace('body{margin:0}', 'html,body{margin:0}body{background:var(--bg)}')
  .replace('.th-dark{', ":root,:root[data-theme='dark']{")
  .replace('.th-light{', ":root[data-theme='light']{")
  .replace('.th-light .only-d,.th-dark .only-l{display:none}',
    ":root[data-theme='light'] .only-d,:root:not([data-theme='light']) .only-l{display:none}\n" +
    ":root[data-theme='light'] .tg-sun,:root:not([data-theme='light']) .tg-moon{display:none}");

body = body
  .replace('<div class="{{rootClass}}">', '<div class="th">')
  .replace(/<button type="button" class="tgl" onClick="\{\{toggle\}\}" aria-label="\{\{toggleLabel\}\}">/,
    '<button type="button" class="tgl" id="theme-toggle" aria-label="Switch colour theme">')
  .replace(/<sc-if value="\{\{isDark\}\}" hint-placeholder-val="\{\{true\}\}"><svg class="ico"/, '<svg class="ico tg-sun"')
  .replace(/<sc-if value="\{\{isLight\}\}" hint-placeholder-val="\{\{false\}\}"><svg class="ico"/, '<svg class="ico tg-moon"')
  .replace(/<\/svg><\/sc-if>/g, '</svg>')
  .replace(/<a href="#copy" (class="btn glow"[^>]*)>([\s\S]*?)Copy the setup message<\/a>/,
    '<button type="button" data-copy $1>$2<span data-copy-label>Copy the setup message</span></button>')
  .replace('<a href="#d" style="color:var(--quiet);text-decoration:none">Developers</a>',
    '<a href="/docs/" style="color:var(--quiet);text-decoration:none">Docs</a>')
  .replace(/<a href="#d"([^>]*)>(<svg[^]*?<\/svg>)Docs for developers<\/a>/, '<a href="/docs/"$1>$2Documentation</a>')
  .replace(/<a href="#d"([^>]*)>(<svg[^]*?<\/svg>)Privacy<\/a>/, '<a href="/docs/privacy/"$1>$2Privacy</a>')
  .replace(/<a href="#d"([^>]*)>(<svg[^]*?<\/svg>)Source code<\/a>/, '<a href="https://github.com/ilien-dev/svipall"$1>$2Source code</a>');

if (/\{\{|sc-if|sc-for|href="#d"|_blob|onClick/.test(body)) {
  throw new Error('port-orbit: template syntax left in the body: ' + /.{0,60}(\{\{|sc-if|sc-for|href="#d"|_blob|onClick).{0,60}/.exec(body)[0]);
}
/* Astro reads { } in markup as expressions. */
if (/[{}]/.test(body)) throw new Error('port-orbit: a brace in the markup would be read as an expression');

writeFileSync('src/home/orbit.body.html', body.trim() + '\n');
writeFileSync('src/styles/orbit.css', css.trim() + '\n');
console.log('port-orbit: wrote src/home/orbit.body.html and src/styles/orbit.css');
