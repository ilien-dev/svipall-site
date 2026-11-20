/*
 * The product page's moving parts: the hero's heat field (WebGL, loaded only
 * when it can run), the card that follows its visits, the "different face at
 * every gate" player and the before/after divider.
 *
 * This module is bundled and runs once per document; the router swaps the
 * body in and out without a reload and fires `astro:page-load` after each
 * swap, so everything is set up on that event and torn down on the next one
 * (loops, timers, observers). Loops stop when off screen or in a hidden tab.
 * Under reduced motion nothing animates: the hero shows its still picture
 * and the last frame of a visit, and the player shows each result at once.
 */

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector(sel) as T | null;
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll(sel)] as T[];
const clamp01 = (x: number, a: number, b: number) => Math.min(1, Math.max(0, (x - a) / (b - a)));
const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

/* Rule 5: text never swaps in place. It leaves, changes, and comes back. */
function swap(el: Element, apply: () => void) {
  if (reduce()) { apply(); return; }
  const out = el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px)' }], { duration: 160, easing: 'ease-in', fill: 'forwards' });
  out.onfinish = () => { apply(); out.cancel(); el.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.16,1,.3,1)' }); };
}

let teardown: (() => void)[] = [];
function cleanup() { for (const f of teardown) { try { f(); } catch {} } teardown = []; }

/* ── the visits the hero plays, and what the card says at each moment ── */
type Kind = 'open' | 'wall' | 'no';
interface Visit { host: string; g: [number, number]; ask: string; kind: Kind; got: string }
const VISITS: Visit[] = [
  { host: 'news.example.org', g: [4, 11], ask: 'What happened in Lisbon today?', kind: 'open', got: 'the article, 2,140 words' },
  { host: 'flights.example.com', g: [8, 17], ask: 'Cheapest flight to Lisbon this weekend?', kind: 'wall', got: '48 fares, read on the third way of visiting' },
  { host: 'members.example.com', g: [13, 13], ask: 'What is in my order history there?', kind: 'no', got: 'a sign-in wall, so nothing made up' },
];
const DUR: Record<Kind, number> = { open: 6.4, wall: 8.2, no: 6.8 };
const TOTAL = VISITS.reduce((a, v) => a + DUR[v.kind], 0);
const WAYS = ['A plain request', 'A hidden browser', 'A disguised browser'];

interface CardState { title: string; state: [string, string]; rows: [string, string, number, 'read' | 'refused' | 'live'][] }
function cardAt(v: Visit, u: number): CardState {
  if (u < 2) return { title: 'On the way', state: ['go', 'Going'], rows: [] };
  if (v.kind === 'open') {
    const p = clamp01(u, 2, 3.1);
    return { title: 'Reading the page', state: p < 1 ? ['go', 'Reading'] : ['ok', 'Read · back to your AI'], rows: [[WAYS[0], p < 1 ? `${Math.round(p * 100)}%` : 'read', p, p < 1 ? 'live' : 'read']] };
  }
  if (v.kind === 'wall') {
    const rows: CardState['rows'] = [[WAYS[0], 'refused', 1, 'refused']];
    if (u < 2.7) return { title: 'A wall at the door', state: ['wall', 'Trying a stronger way'], rows };
    rows.push([WAYS[1], 'refused', 1, 'refused']);
    if (u < 3.3) return { title: 'A wall at the door', state: ['wall', 'Trying a stronger way'], rows };
    const p = clamp01(u, 3.3, 4.6);
    rows.push([WAYS[2], p < 1 ? `${Math.round(p * 100)}%` : 'read', p, p < 1 ? 'live' : 'read']);
    return { title: p < 1 ? 'A wall at the door' : 'Got in on the third way', state: p < 1 ? ['wall', 'Reading'] : ['ok', 'Read · back to your AI'], rows };
  }
  const rows: CardState['rows'] = [[WAYS[0], u < 2.6 ? 'trying' : 'sign-in wall', u < 2.6 ? clamp01(u, 2, 2.6) : 1, u < 2.6 ? 'live' : 'refused']];
  return { title: 'A sign-in wall', state: u < 3.2 ? ['wall', 'Checking the wall'] : ['no', 'Stopped · your AI is told'], rows };
}
function visitAt(t: number) {
  let tt = ((t % TOTAL) + TOTAL) % TOTAL, k = 0;
  while (tt > DUR[VISITS[k].kind]) { tt -= DUR[VISITS[k].kind]; k++; }
  return { k, v: VISITS[k], u: tt };
}

function initHero() {
  const hero = $('.hx');
  if (!hero) return;
  const stage = $('.hx-stage', hero)!, cv = $<HTMLCanvasElement>('[data-heat-canvas]', hero)!, still = $<SVGSVGElement>('[data-heat-still]', hero)!;
  const ov = $<SVGSVGElement>('[data-heat-ov]', hero)!, frame = $<SVGRectElement>('[data-heat-frame]', hero)!, handles = $$<SVGCircleElement>('[data-heat-handles] circle', hero);
  const tagS = $('[data-heat-site]', hero)!, tagO = $('[data-heat-org]', hero)!, ask = $('[data-heat-ask]', hero)!;
  const card = { title: $('[data-heat-title]', hero)!, step: $('[data-heat-step]', hero)!, host: $('[data-heat-host]', hero)!, rows: $('[data-heat-rows]', hero)!, state: $('[data-heat-state]', hero)! };

  /* The still picture: the same field seen from above. It is what reduced
     motion, a missing WebGL, or the moment before three.js arrives show. */
  {
    const N = 22, s = 30; let h = '';
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const v = Math.max(0, 1 - Math.hypot(x - 7, y - 9) / 8, 0.8 * (1 - Math.hypot(x - 16, y - 6) / 5), 0.5 * (1 - Math.hypot(x - 13, y - 17) / 5));
      const c = v > 0.8 ? 'var(--heat4)' : v > 0.55 ? 'var(--heat3)' : v > 0.3 ? 'var(--heat2)' : v > 0.08 ? 'var(--heat1)' : 'var(--heat0)';
      h += `<rect x="${x * s + 1}" y="${y * s + 1}" width="${s - 3}" height="${s - 3}" rx="3" style="fill:${c}"/>`;
    }
    still.innerHTML = h;
  }

  let shown = { k: -1, title: '', state: '', rows: 0 };
  const tone = (r: CardState['rows'][number]) => (r[3] === 'refused' ? 'var(--gry)' : r[3] === 'read' ? 'var(--ink)' : 'var(--ac)');
  const rowHtml = (r: CardState['rows'][number]) => `<div class="hx-row"><span>${r[0]}</span><span data-v>${r[1]}</span></div><div class="hx-bar"><b style="background:${tone(r)}"></b></div>`;
  const paintBars = (c: CardState) => {
    const bars = $$('.hx-bar b', card.rows), vals = $$('[data-v]', card.rows);
    c.rows.forEach((r, i) => {
      if (bars[i]) { bars[i].style.transform = `scaleX(${r[2]})`; bars[i].style.background = tone(r); }
      if (vals[i] && vals[i].textContent !== r[1]) vals[i].textContent = r[1];
    });
  };
  const renderCard = (v: Visit, u: number, k: number) => {
    const c = cardAt(v, u), st = c.state.join('|');
    if (k !== shown.k) {
      shown = { k, title: c.title, state: st, rows: c.rows.length };
      swap(card.title.closest('.hx-card')!, () => {
        card.title.textContent = c.title; card.step.textContent = `${k + 1} / 3`; card.host.textContent = v.host;
        card.rows.innerHTML = c.rows.map(rowHtml).join('');
        card.state.dataset.k = c.state[0]; (card.state.lastElementChild as HTMLElement).textContent = c.state[1];
        paintBars(c);
      });
      return;
    }
    if (c.title !== shown.title) { shown.title = c.title; swap(card.title, () => { card.title.textContent = c.title; }); }
    if (st !== shown.state) { shown.state = st; swap(card.state, () => { card.state.dataset.k = c.state[0]; (card.state.lastElementChild as HTMLElement).textContent = c.state[1]; }); }
    if (c.rows.length > shown.rows) { for (const r of c.rows.slice(shown.rows)) card.rows.insertAdjacentHTML('beforeend', rowHtml(r)); shown.rows = c.rows.length; }
    paintBars(c);
  };
  const renderAsk = (v: Visit, u: number) => {
    const back = u > DUR[v.kind] - 1.6, key = (back ? 'b' : 'a') + v.host;
    if (ask.dataset.key === key) return;
    ask.dataset.key = key;
    /* only the words move: the bubble's own transform is its place on the field */
    const inner = ask.firstElementChild as HTMLElement;
    swap(inner, () => {
      ask.classList.toggle('back', back && v.kind !== 'no'); ask.classList.toggle('no', back && v.kind === 'no');
      inner.innerHTML = `<small>${back ? 'Back to your AI' : 'Your AI asks'}</small><span>${back ? v.got : v.ask}</span>`;
    });
  };

  /* Reduced motion, or no WebGL: the still field and the last frame of the
     second visit, which tells the whole story in one card. */
  const showStill = () => { hero.classList.remove('gl'); renderCard(VISITS[1], DUR.wall - 2, 1); };
  if (reduce()) { showStill(); return; }
  showStill();

  let alive = true;
  teardown.push(() => { alive = false; });
  import('./heat-three').then((THREE) => {
    if (!alive) return;
    let R: import('three').WebGLRenderer;
    try { R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, powerPreference: 'low-power' }); }
    catch { return; }
    R.setPixelRatio(Math.min(2, devicePixelRatio));
    const S = new THREE.Scene(), C = new THREE.PerspectiveCamera(34, 1, 1, 400);
    const N = 30, G = new THREE.BoxGeometry(0.86, 1, 0.86); G.translate(0, 0.5, 0);
    const I = new THREE.InstancedMesh(G, new THREE.MeshBasicMaterial(), N * N); I.instanceMatrix.setUsage(THREE.DynamicDrawUsage); S.add(I);
    const col = new THREE.Color(), m4 = new THREE.Matrix4(), tmp = new THREE.Color();
    const W = (gx: number, gy: number) => new THREE.Vector3(gx - N / 2, 0, gy - N / 2);
    const org = W(21, 10);
    const mat = (c = 0xffffff, o = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: o < 1 || true, opacity: o, side: THREE.DoubleSide });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.25, 40), mat()); disc.position.copy(org).y = 0.12; S.add(disc);
    const oring = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.05, 48), mat()); oring.rotation.x = -Math.PI / 2; oring.position.copy(org).y = 0.3; S.add(oring);
    const P = new Float32Array(64 * 3), lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(P, 3));
    const lm = new THREE.LineBasicMaterial({ transparent: true }), line = new THREE.Line(lg, lm); S.add(line);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), mat()); S.add(head);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), mat(0xffffff, 0.25)); S.add(halo);
    const tring = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.82, 40), mat()); tring.rotation.x = -Math.PI / 2; S.add(tring);

    /* colours come from the theme's tokens and follow a theme switch */
    const pal = { heat: [] as import('three').Color[], read: new THREE.Color(), wall: new THREE.Color(), no: new THREE.Color(), org: new THREE.Color() };
    const readTheme = () => {
      const cs = getComputedStyle(document.documentElement), g = (n: string) => new THREE.Color(cs.getPropertyValue(n).trim() || '#888');
      pal.heat = [0, 1, 2, 3, 4].map((i) => g(`--heat${i}`)); pal.read = g('--h-read'); pal.wall = g('--h-wall'); pal.no = g('--h-no'); pal.org = g('--h-org');
      (disc.material as import('three').MeshBasicMaterial).color.copy(pal.org); (oring.material as import('three').MeshBasicMaterial).color.copy(pal.org);
    };
    readTheme();
    const mo = new MutationObserver(readTheme); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    teardown.push(() => mo.disconnect());
    const heatCol = (v: number) => { const x = Math.min(3.999, Math.max(0, v * 0.82 * 4)), i = Math.floor(x); return col.copy(pal.heat[i]).lerp(pal.heat[i + 1], x - i); };
    const heat = (x: number, y: number, t: number) => Math.min(1, Math.max(Math.max(0, 1 - Math.hypot(x - 9, y - 12) / 10), 0.8 * Math.max(0, 1 - Math.hypot(x - 20 + Math.sin(t * 0.4) * 2, y - 8) / 6.5), 0.5 * Math.max(0, 1 - Math.hypot(x - 16, y - 22) / 6)) + 0.05 * Math.sin(x * 0.9 + t * 1.3) * Math.cos(y * 0.7 + t));

    let w = 1, h = 1, minX = 4;
    const size = () => { w = cv.clientWidth || 1; h = cv.clientHeight || 1; minX = Math.max(4, 4 - stage.offsetLeft); R.setSize(w, h, false); C.aspect = w / h; C.updateProjectionMatrix(); };
    const ro = new ResizeObserver(size); ro.observe(stage); size();
    teardown.push(() => ro.disconnect());
    const proj = (v: import('three').Vector3) => { const p = v.clone().project(C); return [(p.x + 1) / 2 * w, (1 - p.y) / 2 * h] as const; };
    const put = (el: HTMLElement, x: number, y: number, ew: number, eh: number) => {
      const cx = Math.max(minX, Math.min(w - ew - 4, x)), cy = Math.max(4, Math.min(h - eh - 4, y));
      el.style.transform = `translate(${cx.toFixed(1)}px,${cy.toFixed(1)}px)`;
    };
    let mx = 0, my = 0;
    const onMove = (e: PointerEvent) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; };
    addEventListener('pointermove', onMove, { passive: true }); teardown.push(() => removeEventListener('pointermove', onMove));

    let visible = true, raf = 0, t = 0, last = 0;
    const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) start(); }, { threshold: 0.02 });
    io.observe(hero); teardown.push(() => io.disconnect());
    const onVis = () => { if (!document.hidden) start(); };
    document.addEventListener('visibilitychange', onVis); teardown.push(() => document.removeEventListener('visibilitychange', onVis));
    teardown.push(() => {
      cancelAnimationFrame(raf); raf = 0;
      S.traverse((o) => { const m = o as import('three').Mesh; m.geometry?.dispose(); (m.material as import('three').Material | undefined)?.dispose?.(); });
      R.dispose(); R.forceContextLoss();
    });

    const tagW = () => [tagS.offsetWidth, tagS.offsetHeight, tagO.offsetWidth, tagO.offsetHeight, ask.offsetWidth, ask.offsetHeight];
    let dims = tagW(), dimsAt = 0;
    function frameFn(now: number) {
      raf = 0;
      if (!alive || !visible || document.hidden) return;
      t += Math.min(0.05, (now - (last || now)) / 1000); last = now;
      const { k, v, u } = visitAt(t), D = DUR[v.kind], tg = v.g, tgv = W(tg[0], tg[1]);
      let th = 1.2; let tc = tmp.copy(pal.read).lerp(pal.heat[1], 0.5);
      if (u >= 2) {
        if (v.kind === 'open') { th = 1.6; tc = pal.read; }
        else if (v.kind === 'wall') {
          if (u < 3.3) { th = 1.6 + ease(clamp01(u, 2, 2.5)) * 4.6; tc = pal.wall; }
          else if (u < 4.6) { th = 6.2; tc = tmp.copy(pal.wall).lerp(pal.read, clamp01(u, 3.8, 4.6)); }
          else { th = 6.2 - ease(clamp01(u, 4.6, 5.2)) * 4.6; tc = pal.read; }
        } else { th = 1.6 + ease(clamp01(u, 2, 2.5)) * 4.8; tc = u < 3.2 ? pal.wall : tmp.copy(pal.wall).lerp(pal.no, clamp01(u, 3.2, 3.8)); }
      }
      let i = 0;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const hv = heat(x, y, t), isT = x === tg[0] && y === tg[1];
        if (isT) { m4.makeScale(1.05, th, 1.05); col.copy(tc); } else { m4.makeScale(1, 0.12 + hv * hv * 3.4, 1); heatCol(hv); }
        m4.setPosition(x - N / 2, 0, y - N / 2); I.setMatrixAt(i, m4); I.setColorAt(i, col); i++;
      }
      I.instanceMatrix.needsUpdate = true; if (I.instanceColor) I.instanceColor.needsUpdate = true;
      const a = org.clone().setY(0.6), b = tgv.clone().setY(th + 0.4), c = a.clone().lerp(b, 0.5).setY(Math.max(a.y, b.y) + 9);
      const curve = new THREE.QuadraticBezierCurve3(a, c, b);
      const outP = ease(clamp01(u, 0.5, 2)), backP = ease(clamp01(u, D - 1.9, D - 0.5));
      for (let j = 0; j < 64; j++) { const p = curve.getPoint(j / 63); P[j * 3] = p.x; P[j * 3 + 1] = p.y; P[j * 3 + 2] = p.z; }
      lg.attributes.position.needsUpdate = true;
      const hc = (head.material as import('three').MeshBasicMaterial).color;
      if (backP > 0) { lg.setDrawRange(Math.floor(64 * backP), 64); lm.color.copy(v.kind === 'no' ? pal.no : pal.read); head.position.copy(curve.getPoint(1 - backP)); hc.copy(lm.color); }
      else { lg.setDrawRange(0, Math.max(2, Math.floor(64 * outP))); lm.color.copy(pal.wall); head.position.copy(curve.getPoint(outP)); hc.copy(pal.wall); }
      head.visible = halo.visible = u > 0.5 && u < D - 0.5 && !(outP >= 1 && backP <= 0);
      halo.position.copy(head.position); (halo.material as import('three').MeshBasicMaterial).color.copy(hc); halo.scale.setScalar(1 + Math.sin(t * 8) * 0.15);
      lm.opacity = u > D - 0.4 ? clamp01(D - u, 0, 0.4) : 1;
      tring.visible = u > 2 && u < D - 1.9; tring.position.copy(tgv).setY(0.06);
      const kk = (t * 0.9) % 1; tring.scale.setScalar(1 + kk * 3.2); const tm = tring.material as import('three').MeshBasicMaterial; tm.opacity = (1 - kk) * 0.9; tm.color.copy(tc);
      const ok2 = (t * 0.6) % 1; oring.scale.setScalar(1 + ok2 * 1.6); (oring.material as import('three').MeshBasicMaterial).opacity = 1 - ok2;
      const ang = -0.72 + Math.sin(t * 0.07) * 0.18 + mx * 0.35; C.position.set(Math.cos(ang) * 44, 27 - my * 8, Math.sin(ang) * 44); C.lookAt(2, 0, 1);
      R.render(S, C);

      /* overlays: the frame around the site, its name, Svipall, the question */
      const pts = [proj(tgv.clone().setY(th)), proj(tgv), proj(tgv.clone().add(new THREE.Vector3(-0.9, th * 0.5, 0))), proj(tgv.clone().add(new THREE.Vector3(0.9, th * 0.5, 0)))];
      const x0 = Math.min(...pts.map((p) => p[0])) - 24, x1 = Math.max(...pts.map((p) => p[0])) + 24, y0 = Math.min(...pts.map((p) => p[1])) - 24, y1 = Math.max(...pts.map((p) => p[1])) + 18;
      frame.setAttribute('x', x0.toFixed(1)); frame.setAttribute('y', y0.toFixed(1)); frame.setAttribute('width', (x1 - x0).toFixed(1)); frame.setAttribute('height', (y1 - y0).toFixed(1));
      [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(([x, y], n) => { handles[n].setAttribute('cx', x.toFixed(1)); handles[n].setAttribute('cy', y.toFixed(1)); });
      ov.classList.toggle('on', u > 1.6 && u < D - 0.4);
      if (now - dimsAt > 500) { dims = tagW(); dimsAt = now; }
      const siteK = u < 2 ? 'go' : v.kind === 'open' ? 'open' : v.kind === 'wall' ? (u < 4.6 ? 'wall' : 'open') : u < 3.2 ? 'wall' : 'no';
      if (tagS.dataset.k !== siteK) tagS.dataset.k = siteK;
      const hb = tagS.lastElementChild!; if (hb.textContent !== v.host) hb.textContent = v.host;
      tagS.classList.toggle('on', u > 0.3);
      put(tagS, x1 + 8, y0 - 4, dims[0], dims[1]);
      const po = proj(org.clone().setY(0.3));
      put(tagO, po[0] + 24, po[1] + 6, dims[2], dims[3]);
      put(ask, po[0] - dims[4] * 0.55, po[1] - dims[5] - 40, dims[4], dims[5]);
      renderCard(v, u, k); renderAsk(v, u);
      if (!hero.classList.contains('gl')) hero.classList.add('gl');
      raf = requestAnimationFrame(frameFn);
    }
    function start() { if (!raf && alive && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frameFn); } }
    start();
  }).catch(() => {});
}

/* ── a different face at every gate: one card turn per way of visiting ── */
function initGates() {
  const root = $('#gates'); if (!root) return;
  const idc = $('[data-idc]', root)!, fa = $('.idf-a', idc)!, fb = $('.idf-b', idc)!, cap = $('[data-gcap]', root)!, prog = $('[data-gprog]', root)!;
  const tabs = $$<HTMLButtonElement>('[data-scen] button', root), rungs = $$('[data-ladder] li', root);
  const TIERS = [['A plain request', 'Asks for the page, nothing more'], ['A hidden browser', 'Runs the page like a browser would'], ['A disguised browser', 'Hides the signs of automation'], ['A real browser', 'With its own profile for this site'], ['A patient visit', 'Waits and answers the challenge']];
  const S = [
    { host: 'docs.example.dev', need: 1, fails: [] as string[], got: '2,480 words', cap: 'No wall: a plain request is enough.' },
    { host: 'shop.example.com', need: 2, fails: ['A blank page: it only fills in with JavaScript'], got: '48 products', cap: 'The page is empty until a browser runs it, so Svipall opens a hidden one.' },
    { host: 'news.example.org', need: 3, fails: ['“Checking your browser…”', 'Automation spotted'], got: '2,140 words', cap: 'A “checking your browser” screen: a disguised browser gets through.' },
    { host: 'tickets.example.com', need: 4, fails: ['“Checking your browser…”', 'Automation spotted', 'The browser itself was rejected'], got: 'Seat map, 312 seats', cap: 'The site inspects the browser itself: a real browser with its own profile passes.' },
    { host: 'forum.example.net', need: 5, fails: ['“Checking your browser…”', 'Automation spotted', 'The browser itself was rejected', 'A challenge waits to be answered'], got: 'Thread, 61 posts', cap: 'A challenge to answer: the patient visit waits for it and answers it.' },
    { host: 'members.example.com', need: 0, fails: ['A sign-in wall'], got: '', cap: 'A sign-in wall: Svipall never signs in for you, so it stops and tells your AI.' },
  ];
  const ICON: Record<string, string> = {
    try: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    wall: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 12h18M9 5v7M15 12v7"/>',
    ok: '<path d="M5 13l4 4L19 7"/>', no: '<circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/>',
  };
  const CHIP: Record<string, string> = { try: 'Trying', wall: 'Wall · a stronger way next', ok: 'Got in', no: 'Refused · your AI is told' };
  const face = (s: (typeof S)[number], t: number, st: string, why = '') => {
    const pv = st === 'try' ? '<div class="pv try"><i></i><i></i><i></i><span>Visiting…</span></div>'
      : st === 'wall' ? `<div class="pv wall"><b>${why}</b><span>Not the page. Trying a stronger way.</span></div>`
      : st === 'ok' ? `<div class="pv ok"><i></i><i></i><i></i><i></i><span>Read · ${s.got}</span></div>`
      : `<div class="pv no"><b>${why}</b><span>Stopped. Svipall never signs in for you; your AI is told.</span></div>`;
    return `<span class="badge"><svg viewBox="0 0 24 24" aria-hidden="true">${ICON[st]}</svg></span><small>WAY ${t + 1} OF 5</small><h3>${TIERS[t][0]}</h3><p class="what">${TIERS[t][1]}</p><div class="host">${s.host}</div><div class="face">One face for this site, kept the whole visit</div>${pv}<span class="chip3 ${st}"><i></i>${CHIP[st]}</span>`;
  };
  let rot = 0, front = fa, token = 0, timer = 0;
  const sleep = (ms: number) => new Promise<void>((r) => { timer = window.setTimeout(r, ms); });
  const show = (html: string, st: string, flip: boolean) => {
    if (flip && !reduce()) {
      const back = front === fa ? fb : fa;
      back.innerHTML = html; back.className = `idf ${back === fa ? 'idf-a' : 'idf-b'} ${st}`;
      rot += 180; idc.style.transform = `rotateY(${rot}deg) rotateX(6deg)`; front = back;
    } else {
      const el = front; el.classList.add('swap');
      window.setTimeout(() => { el.innerHTML = html; el.className = `idf ${el === fa ? 'idf-a' : 'idf-b'} ${st}`; }, reduce() ? 0 : 180);
    }
  };
  const rung = (i: number, cls: string, txt: string) => { const r = rungs[i]; if (!r) return; r.className = cls; const em = r.querySelector('em')!; if (em.textContent !== txt) swap(em, () => { em.textContent = txt; }); };
  const caption = (t: string) => { if (cap.textContent !== t) swap(cap, () => { cap.textContent = t; }); };
  const select = (k: number) => tabs.forEach((b, j) => { b.setAttribute('aria-selected', String(j === k)); b.tabIndex = j === k ? 0 : -1; });
  const setProg = (sec: number) => { prog.style.transition = 'none'; prog.style.transform = 'scaleX(0)'; void prog.offsetWidth; prog.style.transition = `transform ${sec}s linear`; prog.style.transform = 'scaleX(1)'; };

  /* reduced motion: the result of the chosen site, at once, no turning */
  const still = (k: number) => {
    const s = S[k]; select(k); caption(s.cap); prog.style.transform = 'scaleX(1)';
    const last = s.need ? s.need - 1 : 0;
    rungs.forEach((r, i) => rung(i, i < last ? 'wall' : '', i < last ? 'wall' : '—'));
    if (s.need === 0) { rung(0, 'no', 'stops here'); show(face(s, 0, 'no', s.fails[0]), 'no', false); }
    else { rung(last, 'ok', 'got in'); show(face(s, last, 'ok'), 'ok', false); }
  };
  async function play(k: number, tk: number) {
    const s = S[k]; select(k); caption(s.cap);
    rungs.forEach((_, i) => rung(i, '', '—'));
    const last = s.need ? s.need - 1 : 0; setProg((last + 1) * 2.6 + 3);
    for (let t = 0; t <= last; t++) {
      if (tk !== token) return;
      show(face(s, t, 'try'), 'try', t > 0); rung(t, 'on', 'trying…'); await sleep(1300); if (tk !== token) return;
      if (s.need === 0) { show(face(s, t, 'no', s.fails[0]), 'no', false); rung(t, 'no', 'stops here'); await sleep(3200); break; }
      if (t < last) { show(face(s, t, 'wall', s.fails[t]), 'wall', false); rung(t, 'wall', 'wall'); await sleep(1300); }
      else { show(face(s, t, 'ok'), 'ok', false); rung(t, 'ok', 'got in'); await sleep(3200); }
    }
    if (tk === token && running) play((k + 1) % S.length, tk);
  }
  let running = false, started = false, current = 0;
  const go = (k: number) => { current = k; token++; clearTimeout(timer); if (reduce()) still(k); else { running = true; play(k, token); } };
  tabs.forEach((b, j) => {
    b.addEventListener('click', () => { started = true; idc.setAttribute('aria-live', 'polite'); go(j); });
    b.addEventListener('keydown', (e) => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d) { e.preventDefault(); const n = (j + d + tabs.length) % tabs.length; tabs[n].focus(); started = true; go(n); } });
  });
  /* plays while on screen, pauses (and resumes on the same site) when not */
  const io = new IntersectionObserver((es) => {
    if (es[0].isIntersecting) { if (!started) { started = true; go(0); } else if (!running) go(current); }
    else if (running) { running = false; token++; clearTimeout(timer); }
  }, { threshold: 0.25 });
  io.observe(idc);
  if (reduce()) still(0);
  teardown.push(() => { io.disconnect(); token++; clearTimeout(timer); running = false; });
}

/* ── before / after: the clean layer slides by transform only ── */
function initCompare() {
  const box = $('[data-cmp]'); if (!box) return;
  const clean = $('[data-cmp-clean]', box)!, inner = $('[data-cmp-in]', box)!, handle = $<HTMLButtonElement>('[data-cmp-handle]', box)!;
  let frac = 0.5, user = false, raf = 0, a = 0, visible = false;
  const set = (f: number) => {
    frac = Math.max(0.04, Math.min(0.96, f)); const x = frac * box.clientWidth;
    clean.style.transform = `translateX(${x}px)`; inner.style.transform = `translateX(${-x}px)`; handle.style.transform = `translateX(${x - 1}px)`;
    handle.setAttribute('aria-valuenow', String(Math.round(frac * 100)));
  };
  const fromEvent = (e: PointerEvent) => { const r = box.getBoundingClientRect(); set((e.clientX - r.left) / r.width); };
  const down = (e: PointerEvent) => { user = true; box.setPointerCapture(e.pointerId); fromEvent(e); };
  const move = (e: PointerEvent) => { if (e.buttons) fromEvent(e); };
  box.addEventListener('pointerdown', down); box.addEventListener('pointermove', move);
  handle.addEventListener('keydown', (e) => { const d = e.key === 'ArrowRight' ? 0.05 : e.key === 'ArrowLeft' ? -0.05 : 0; if (d) { e.preventDefault(); user = true; set(frac + d); } });
  const ro = new ResizeObserver(() => set(frac)); ro.observe(box);
  const loop = () => { raf = 0; if (user || !visible || reduce()) return; a += 0.012; set(0.5 + Math.sin(a) * 0.34); raf = requestAnimationFrame(loop); };
  const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }, { threshold: 0.05 });
  io.observe(box); set(0.5);
  teardown.push(() => { io.disconnect(); ro.disconnect(); cancelAnimationFrame(raf); });
}

function init() {
  cleanup();
  if (!$('.hx')) return;
  initHero(); initGates(); initCompare();
}
document.addEventListener('astro:page-load', init);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
