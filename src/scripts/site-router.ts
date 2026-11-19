/*
 * site-router — moving around the site without reloading the page.
 *
 * Cross-document view transitions were not enough: a browser that aborts one
 * (some do, under load or automation) falls back to a plain reload, and the
 * header and sky flash. This keeps the document and swaps only what changes.
 *
 *   - docs to docs, same layout (sidebar on both pages): the reading column and
 *     the On this page rail are replaced, the sidebar stays and its amber pill
 *     moves;
 *   - docs to docs, different layout (the docs home has no sidebar): the
 *     sidebar and the main frame are replaced;
 *   - product page to docs and back: the two are different documents (their
 *     own stylesheets and scripts), so the whole body is swapped, the next
 *     page's stylesheets are loaded first and switched on in the same frame,
 *     and its scripts run. The header is the same component on both sides, so
 *     it does not visibly change; everything around it fades out and in.
 *
 * Modified clicks, new tabs, downloads, same-page anchors and any path that is
 * neither the product page nor /docs are left to the browser. A failed fetch
 * or a failed swap falls back to a normal navigation.
 *
 * The product page and the docs each bundle this module; whichever runs first
 * owns the page, so a second copy does nothing.
 */

type Surface = 'home' | 'docs';
const OWNER = Symbol.for('svipall.site-router');

if (!(window as any)[OWNER]) {
  (window as any)[OWNER] = true;
  start();
}

function start() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ROOT_FLAGS = ['data-has-toc', 'data-has-sidebar', 'data-has-hero'];
  const KEEP_ON_ROOT = new Set(['class', 'style', 'data-theme']);
  const cache = new Map<string, Promise<Document | null>>();
  /* An inline module runs once per text: Starlight's define custom elements,
     which a second run would try to define again. */
  const ranModules = new Set<string>();
  for (const s of document.querySelectorAll<HTMLScriptElement>('script[type="module"]:not([src])')) ranModules.add(s.text);
  /* Every script file this page has run, kept apart from the DOM: a swapped-in
     body carries <script src> elements that never ran. */
  const ranFiles = new Set([...document.querySelectorAll('script[src]')].map((s) => s.getAttribute('src')));
  let shown = location.pathname;
  let busy = 0;

  const surfaceOf = (path: string): Surface | null =>
    path === '/' || path === '/index.html' ? 'home' : path.startsWith('/docs') ? 'docs' : null;

  function load(url: URL): Promise<Document | null> {
    const key = url.pathname;
    if (!cache.has(key)) {
      cache.set(
        key,
        fetch(url.pathname, { credentials: 'same-origin' })
          .then((res) => (res.ok && (res.headers.get('content-type') || '').includes('text/html') ? res.text() : null))
          .then((html) => (html ? new DOMParser().parseFromString(html, 'text/html') : null))
          .catch(() => null)
          /* A failure is not remembered: the next click asks again. */
          .then((doc) => {
            if (!doc) cache.delete(key);
            return doc;
          }),
      );
    }
    return cache.get(key)!;
  }

  function routable(a: HTMLAnchorElement, e: MouseEvent): URL | null {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
    if (a.target && a.target !== '_self') return null;
    if (a.hasAttribute('download') || a.getAttribute('rel')?.includes('external')) return null;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !surfaceOf(url.pathname)) return null;
    if (url.pathname === location.pathname) return null; // an anchor on this page
    return url;
  }

  /* ---------- docs to docs ---------- */

  function replace(selector: string, next: Document) {
    const old = document.querySelector(selector);
    const fresh = next.querySelector(selector);
    if (old && fresh) old.replaceWith(document.importNode(fresh, true));
    return Boolean(old && fresh);
  }

  function swapDocs(next: Document, url: URL) {
    document.title = next.title;
    const desc = next.querySelector('meta[name="description"]')?.getAttribute('content');
    if (desc) document.querySelector('meta[name="description"]')?.setAttribute('content', desc);
    for (const flag of ROOT_FLAGS) document.documentElement.toggleAttribute(flag, next.documentElement.hasAttribute(flag));

    const hadSidebar = Boolean(document.querySelector('nav.sidebar'));
    const hasSidebar = Boolean(next.querySelector('nav.sidebar'));

    if (hadSidebar && hasSidebar) {
      replace('.main-pane', next);
      replace('.right-sidebar-container', next);
      for (const a of document.querySelectorAll('.sidebar-content a[aria-current="page"]')) a.removeAttribute('aria-current');
      const here = [...document.querySelectorAll<HTMLAnchorElement>('.sidebar-content a')].find(
        (a) => new URL(a.href, location.href).pathname === url.pathname,
      );
      if (here) {
        here.setAttribute('aria-current', 'page');
        here.closest('details')?.setAttribute('open', '');
      }
    } else {
      const page = document.querySelector('.page');
      if (hadSidebar) document.querySelector('nav.sidebar')?.remove();
      const freshNav = next.querySelector('nav.sidebar');
      if (hasSidebar && freshNav && page) page.insertBefore(document.importNode(freshNav, true), document.querySelector('.main-frame'));
      replace('.main-frame', next);
    }
    /* A page may use a component the first one did not (its On this page
       rail, a code block): load the scripts that define them. */
    for (const s of next.querySelectorAll<HTMLScriptElement>('script[type="module"]')) {
      if (s.src ? !ranFiles.has(s.getAttribute('src')) : !ranModules.has(s.text)) run(s, document.head);
    }
    /* And the stylesheets such a component brings (code blocks have their own). */
    const have = new Set(stylesOf(document.head).map(styleKey));
    for (const el of stylesOf(next.head)) if (!have.has(styleKey(el))) document.head.append(document.importNode(el, true));
  }

  async function goDocs(next: Document, url: URL) {
    /* No view transition here: it snapshots the whole reading column (pages
       run to thousands of pixels) and that capture alone cost a 50 ms frame.
       The motion is plain CSS on the swapped elements instead, which the
       compositor runs: the old column fades for 70 ms, the new one rises. */
    if (!reduce) {
      for (const el of document.querySelectorAll('.main-pane, .right-sidebar-container')) el.classList.add('swap-out');
      await new Promise((r) => setTimeout(r, 70));
    }
    const hadSidebar = Boolean(document.querySelector('nav.sidebar'));
    swapDocs(next, url);
    if (!reduce) {
      /* Each class comes off when its animation ends: an element with a
         transform animation in effect becomes the containing block of its
         fixed children, which pushed the fixed On this page rail down. */
      const animate = (el: Element | null, cls: string) => {
        if (!el) return;
        el.classList.add(cls);
        el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
      };
      animate(document.querySelector('.main-pane'), 'swap-in');
      animate(document.querySelector('.right-sidebar-container'), 'swap-fade');
      if (!hadSidebar) animate(document.querySelector('nav.sidebar'), 'swap-side');
      animate(document.querySelector('.sidebar-content a[aria-current="page"]'), 'pill-in');
    }
  }

  /* ---------- product page and docs ---------- */

  const styleKey = (el: Element) =>
    el instanceof HTMLLinkElement
      ? `L ${el.getAttribute('href')} ${el.getAttribute('media') || ''}`
      : `S ${el.getAttribute('data-vite-dev-id') || el.textContent}`;
  const stylesOf = (root: ParentNode) => [...root.querySelectorAll('link[rel="stylesheet"], style')];

  /* Everything around the header: the siblings of each of its ancestors. */
  function around(): HTMLElement[] {
    const header = document.querySelector('.dh')?.closest('header');
    if (!header) return [document.body];
    const out: HTMLElement[] = [];
    for (let el: Element = header; el.parentElement && el !== document.body; el = el.parentElement) {
      for (const sib of el.parentElement.children) {
        if (sib !== el && sib instanceof HTMLElement && !/^(SCRIPT|STYLE|LINK|DIALOG)$/.test(sib.tagName)) out.push(sib);
      }
    }
    return out;
  }

  function fade(els: HTMLElement[], keyframes: Keyframe[], ms: number, easing: string) {
    if (reduce) return Promise.resolve();
    return Promise.all(els.map((el) => el.animate(keyframes, { duration: ms, easing, fill: 'none' }).finished.catch(() => {})));
  }

  /* A script parsed by DOMParser never runs; a fresh element with its
     attributes and text does. */
  function run(old: HTMLScriptElement, parent: Node, before: Node | null = null) {
    const s = document.createElement('script');
    for (const a of old.attributes) s.setAttribute(a.name, a.value);
    s.text = old.text;
    if (s.src) ranFiles.add(s.getAttribute('src'));
    else if (s.type === 'module') ranModules.add(s.text);
    parent.insertBefore(s, before);
    return s;
  }

  function runScripts(next: Document) {
    const headTexts = new Set([...document.head.querySelectorAll('script:not([src])')].map((s) => s.textContent));
    for (const s of next.head.querySelectorAll<HTMLScriptElement>('script')) {
      if (s.type === 'application/ld+json') continue;
      if (s.src ? ranFiles.has(s.getAttribute('src')) : s.type === 'module' ? ranModules.has(s.text) : headTexts.has(s.text)) continue;
      run(s, document.head);
    }
    for (const s of [...document.body.querySelectorAll<HTMLScriptElement>('script')]) {
      if (s.type === 'application/ld+json') continue;
      const skip = s.src ? ranFiles.has(s.getAttribute('src')) : s.type === 'module' && ranModules.has(s.text);
      if (skip) continue;
      run(s, s.parentNode!, s);
      s.remove();
    }
  }

  async function goAcross(next: Document) {
    /* The next page's stylesheets load switched off, and switch on in the
       frame the body changes, so neither page is ever drawn with the other's. */
    const current = new Map(stylesOf(document.head).map((el) => [styleKey(el), el]));
    const wanted = stylesOf(next.head);
    const wantedKeys = new Set(wanted.map(styleKey));
    const added: Element[] = [];
    const loads: Promise<unknown>[] = [];
    for (const el of wanted) {
      if (current.has(styleKey(el))) continue;
      const fresh = document.importNode(el, true) as HTMLElement;
      fresh.dataset.media = fresh.getAttribute('media') ?? '';
      fresh.setAttribute('media', 'not all');
      if (fresh instanceof HTMLLinkElement) {
        loads.push(new Promise((r) => { fresh.addEventListener('load', r, { once: true }); fresh.addEventListener('error', r, { once: true }); }));
      }
      document.head.append(fresh);
      added.push(fresh);
    }
    await Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 4000))]);

    await fade(around(), [{ opacity: 1 }, { opacity: 0, transform: 'translateY(-8px)' }], 110, 'ease-in');

    /* The sky drifts on: the next page's layer starts where this one is. */
    const sky = document.getAnimations().find((a) => (a as CSSAnimation).animationName === 'sky-drift');
    const skyAt = sky?.currentTime;

    const root = document.documentElement;
    root.classList.add('vt');
    for (const a of [...root.attributes]) if (!KEEP_ON_ROOT.has(a.name) && !next.documentElement.hasAttribute(a.name)) root.removeAttribute(a.name);
    for (const a of next.documentElement.attributes) if (!KEEP_ON_ROOT.has(a.name)) root.setAttribute(a.name, a.value);

    for (const el of document.head.querySelectorAll('title, meta, link:not([rel="stylesheet"]), script[type="application/ld+json"]')) el.remove();
    for (const el of next.head.querySelectorAll('title, meta, link:not([rel="stylesheet"]), script[type="application/ld+json"]')) {
      document.head.append(document.importNode(el, true));
    }

    for (const a of [...document.body.attributes]) document.body.removeAttribute(a.name);
    for (const a of next.body.attributes) document.body.setAttribute(a.name, a.value);
    /* The brand is the same on both sides: the one on screen stays, so a
       bounce it is playing carries on, and takes the new page's link. */
    const oldBrand = document.querySelector('.dh-brand');
    document.body.replaceChildren(...[...next.body.childNodes].map((n) => document.importNode(n, true)));
    const newBrand = document.querySelector('.dh-brand');
    if (oldBrand && newBrand) {
      oldBrand.setAttribute('href', newBrand.getAttribute('href') || '/');
      newBrand.replaceWith(oldBrand);
    }

    for (const el of added) {
      const media = (el as HTMLElement).dataset.media;
      if (media) el.setAttribute('media', media);
      else el.removeAttribute('media');
      delete (el as HTMLElement).dataset.media;
    }
    for (const [key, el] of current) if (!wantedKeys.has(key)) el.remove();

    runScripts(next);
    if (typeof skyAt === 'number') root.style.setProperty('--sky-delay', `${-skyAt}ms`);
  }

  /* ---------- both ---------- */

  function settle(url: URL) {
    if (url.hash) document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
    else window.scrollTo({ top: (history.state && history.state.y) || 0, behavior: 'instant' as ScrollBehavior });
  }

  /* Starlight builds its search UI on DOMContentLoaded, which a page reached
     through this router never fires: arriving in the docs from the product
     page left the dialog empty. After such a swap the router builds it itself,
     with the same options Starlight passes. */
  async function ensureSearchUI() {
    const host = document.querySelector<HTMLElement>('site-search');
    const mount = document.getElementById('starlight__search');
    if (!host || !mount || mount.childElementCount || mount.dataset.mounted) return;
    mount.dataset.mounted = 'router';
    const [{ PagefindUI }, { pagefindUserConfig }] = await Promise.all([
      // @ts-expect-error — the package ships no types.
      import('@pagefind/default-ui'),
      // @ts-expect-error — a Starlight virtual module.
      import('virtual:starlight/pagefind-config'),
    ]);
    let translations = {};
    try { translations = JSON.parse(host.dataset.translations || '{}'); } catch {}
    const strip = host.dataset.stripTrailingSlash !== undefined;
    const format = (path: string) => (strip ? path.replace(/(.)\/(#.*)?$/, '$1$2') : path);
    const base = import.meta.env.BASE_URL;
    new PagefindUI({
      ...pagefindUserConfig,
      element: '#starlight__search',
      baseUrl: base,
      bundlePath: base.replace(/\/$/, '') + '/pagefind/',
      showImages: false,
      translations,
      showSubResults: true,
      processResult: (result: { url: string; sub_results: Array<{ url: string }> }) => {
        result.url = format(result.url);
        result.sub_results = result.sub_results.map((sub) => ({ ...sub, url: format(sub.url) }));
      },
    });
  }

  function openSearchIfAsked() {
    if (!new URLSearchParams(location.search).has('search')) return;
    history.replaceState(history.state, '', location.pathname + location.hash);
    customElements.whenDefined('site-search').then(() =>
      requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('site-search button[data-open-modal]')?.click()),
    );
  }

  /* The theme has three choices, kept where Starlight keeps it: `light`,
     `dark`, or empty for the system's. The button cycles light, dark,
     system; <html data-theme-choice> tells it which icon to show, and
     <html data-theme> stays what both pages' CSS reads. */
  const NEXT: Record<string, string> = { light: 'dark', dark: '', '': 'light' };
  const NAME: Record<string, string> = { light: 'Light', dark: 'Dark', '': 'System' };
  const systemDark = matchMedia('(prefers-color-scheme: dark)');
  function themeChoice(): string {
    let t: string | null = null;
    try { t = localStorage.getItem('starlight-theme'); } catch {}
    return t === 'light' || t === 'dark' ? t : '';
  }
  function applyTheme(choice: string) {
    const root = document.documentElement;
    root.dataset.theme = choice || (systemDark.matches ? 'dark' : 'light');
    root.dataset.themeChoice = choice || 'system';
  }
  function labelTheme() {
    const choice = themeChoice();
    applyTheme(choice);
    for (const b of document.querySelectorAll('[data-theme-toggle]')) {
      b.setAttribute('aria-label', `Theme: ${NAME[choice]}. Switch to ${NAME[NEXT[choice]]}`);
      b.setAttribute('title', `Theme: ${NAME[choice]}`);
    }
  }
  systemDark.addEventListener('change', () => { if (!themeChoice()) applyTheme(''); });

  async function go(url: URL, push: boolean) {
    const ticket = ++busy;
    const from = surfaceOf(location.pathname);
    const to = surfaceOf(url.pathname);
    const next = await load(url);
    if (ticket !== busy) return;
    if (!next || !to) {
      location.assign(url.href);
      return;
    }
    if (push) {
      history.replaceState({ ...history.state, y: scrollY }, '');
      history.pushState({ site: true }, '', url.href);
    }
    /* A result picked in the search dialog closes it. */
    document.querySelector<HTMLDialogElement>('dialog[open]')?.close();
    try {
      if (from === 'docs' && to === 'docs' && next.querySelector('.main-frame') && document.querySelector('.main-frame')) {
        document.documentElement.classList.add('vt');
        await goDocs(next, url);
        settle(url);
      } else {
        await goAcross(next);
        settle(url);
        if (!reduce) void fade(around(), [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], 320, 'cubic-bezier(.2,.7,.2,1)');
      }
    } catch {
      location.reload();
      return;
    }
    shown = url.pathname;
    labelTheme();
    if (to === 'docs' && from !== 'docs') await ensureSearchUI();
    openSearchIfAsked();
    document.dispatchEvent(new Event('astro:page-load'));
  }

  document.addEventListener('click', (e) => {
    /* The theme switch, on either page: the same key Starlight uses. */
    const toggle = (e.target as Element | null)?.closest?.('[data-theme-toggle]');
    if (toggle) {
      const nextTheme = NEXT[themeChoice()];
      try { localStorage.setItem('starlight-theme', nextTheme); } catch {}
      labelTheme();
      return;
    }
    /* The brand answers a click with a small bounce, whether it scrolls this
       page to the top or leads home from the docs. */
    const brand = (e.target as Element | null)?.closest?.('.dh-brand');
    if (brand) {
      brand.classList.remove('dh-pop');
      void (brand as HTMLElement).offsetWidth;
      brand.classList.add('dh-pop');
      brand.addEventListener('animationend', () => brand.classList.remove('dh-pop'), { once: true });
    }
    /* A search button anywhere on a docs page opens Starlight's search, once
       this click is over: the dialog closes on any click outside it, and this
       one would reach the window after opening it. */
    if ((e.target as Element | null)?.closest?.('[data-open-search]')) {
      setTimeout(() => document.querySelector<HTMLButtonElement>('site-search button[data-open-modal]')?.click());
      return;
    }
    const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!a) return;
    const url = routable(a, e);
    if (!url) return;
    e.preventDefault();
    void go(url, true);
  });

  /* Ctrl/Cmd+K on the product page opens the docs' search (in the docs,
     Starlight's own shortcut does). */
  addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && document.querySelector('[data-search-link]')) {
      e.preventDefault();
      void go(new URL('/docs/?search', location.href), true);
    }
  });

  /* Warm the cache on hover, like the prefetch the browser would do. */
  document.addEventListener('pointerover', (e) => {
    const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.origin === location.origin && surfaceOf(url.pathname) && url.pathname !== location.pathname) void load(url);
  });

  window.addEventListener('popstate', () => {
    if (surfaceOf(location.pathname) && location.pathname !== shown) void go(new URL(location.href), false);
  });

  history.replaceState({ ...history.state, site: true }, '', location.href);
  labelTheme();
  openSearchIfAsked();

  /* The other side and, in the docs, every docs page are fetched once the
     page is idle, one after another, so a click never waits on the network:
     the whole set is a few hundred KB compressed. */
  const idle = (cb: () => void) =>
    'requestIdleCallback' in window ? (window as any).requestIdleCallback(cb, { timeout: 2000 }) : setTimeout(cb, 800);
  idle(async () => {
    await load(new URL(surfaceOf(location.pathname) === 'home' ? '/docs/' : '/', location.href));
    const seen = new Set<string>();
    for (const a of document.querySelectorAll<HTMLAnchorElement>('.sidebar-content a, .dh-card a, .pagination-links a')) {
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !url.pathname.startsWith('/docs') || seen.has(url.pathname)) continue;
      seen.add(url.pathname);
      await load(url);
    }
  });
}
