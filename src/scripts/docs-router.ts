/*
 * docs-router — moving between docs pages without reloading the page.
 *
 * Cross-document view transitions were not enough: a browser that aborts one
 * (some do, under load or automation) falls back to a plain reload, and the
 * sidebar, header and sky all flash. This keeps the document and swaps only
 * what changes:
 *
 *   - same layout (sidebar on both pages): the reading column and the On this
 *     page rail are replaced, the sidebar stays and its amber pill moves;
 *   - different layout (the docs home has no sidebar): the sidebar and the
 *     main frame are replaced, the header stays.
 *
 * The swap runs inside document.startViewTransition where there is one, so the
 * named parts (docs-main, docs-active, docs-toc) animate; elsewhere it is
 * instant. Anything off /docs/ (the product page), modified clicks, new tabs,
 * downloads and same-page anchors are left to the browser. A failed fetch
 * falls back to a normal navigation.
 */

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ROOT_FLAGS = ['data-has-toc', 'data-has-sidebar', 'data-has-hero'];
const cache = new Map<string, Promise<Document | null>>();
let shown = location.pathname;

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
  if (url.origin !== location.origin || !url.pathname.startsWith('/docs')) return null;
  if (url.pathname === location.pathname && url.hash) return null; // an anchor on this page
  return url;
}

function replace(selector: string, next: Document) {
  const old = document.querySelector(selector);
  const fresh = next.querySelector(selector);
  if (old && fresh) old.replaceWith(document.importNode(fresh, true));
  return Boolean(old && fresh);
}

function swap(next: Document, url: URL) {
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

  if (url.hash) document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView();
  else window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
}

async function go(url: URL, push: boolean) {
  const next = await load(url);
  if (!next || !next.querySelector('.main-frame')) {
    location.assign(url.href);
    return;
  }
  if (push) history.pushState({ docs: true }, '', url.href);
  /* A result picked in the search dialog closes it. */
  document.querySelector<HTMLDialogElement>('dialog[open]')?.close();
  const run = () => swap(next, url);
  const vt = (document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } })
    .startViewTransition;
  if (vt && !reduce) {
    document.documentElement.classList.add('vt');
    await vt.call(document, run).finished.catch(() => {});
  } else {
    run();
  }
  shown = url.pathname;
  document.dispatchEvent(new Event('astro:page-load'));
}

document.addEventListener('click', (e) => {
  const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
  if (!a) return;
  const url = routable(a, e);
  if (!url) return;
  e.preventDefault();
  void go(url, true);
});

/* Warm the cache on hover, like the prefetch the browser would do. */
document.addEventListener('pointerover', (e) => {
  const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
  if (!a) return;
  const url = new URL(a.href, location.href);
  if (url.origin === location.origin && url.pathname.startsWith('/docs') && url.pathname !== location.pathname) void load(url);
});

window.addEventListener('popstate', () => {
  if (location.pathname.startsWith('/docs') && location.pathname !== shown) void go(new URL(location.href), false);
});

history.replaceState({ docs: true }, '', location.href);

/* Every docs page is fetched once the page is idle, one after another, so a
   click never waits on the network: the whole docs set is a few hundred KB
   compressed. */
const idle = (cb: () => void) =>
  'requestIdleCallback' in window ? (window as any).requestIdleCallback(cb, { timeout: 2000 }) : setTimeout(cb, 800);
idle(async () => {
  const seen = new Set<string>();
  for (const a of document.querySelectorAll<HTMLAnchorElement>('.sidebar-content a, .dh-card a, .pagination-links a')) {
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !url.pathname.startsWith('/docs') || seen.has(url.pathname)) continue;
    seen.add(url.pathname);
    await load(url);
  }
});
