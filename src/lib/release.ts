/*
 * release — the newest STABLE release of the product, read at build time.
 *
 * This is one half of a pair. The number written into the HTML here is the
 * best answer the site had when it was built; the script in Base.astro asks
 * the same question again in the visitor's browser and raises it if a newer
 * release has appeared since. That is what lets the tag stay correct on a
 * site that has not been rebuilt in months.
 *
 * NEITHER HALF MAY INVENT A NUMBER. When the API does not answer — offline
 * build, rate limit, GitHub down — this returns null and the tag is not drawn
 * at all. A version is a claim about the product like any other on this site,
 * and the rule is the same one: it resolves to a source or it is not made.
 *
 * STABLE ONLY, at the author's direction: no `-rc`, no `-beta`, no `-alpha`.
 * The filter is a SHAPE TEST on the tag (`vX.Y.Z` and nothing after it) and
 * not GitHub's `prerelease` flag alone, because a pre-release published with
 * that flag left unset would otherwise arrive here as the current version.
 * Both tests are applied, and the shape test is the one that cannot be got
 * wrong by hand.
 *
 * The same three rules — the shape test, the comparison, the date format —
 * are implemented a second time in the browser script. They are small and
 * they are stated identically in both places; a shared module would have to
 * be either a client bundle for two dozen bytes of logic or a build import in
 * a file that runs without a build, and both cost more than the repetition.
 */

const REPO = 'ilien-dev/svipall';
const API = `https://api.github.com/repos/${REPO}/releases?per_page=30`;

/* Anchored at both ends: `v1.0.2-rc.1` must fail, and so must `1.0.2`. */
const STABLE = /^v(\d+)\.(\d+)\.(\d+)$/;

/* Written out rather than taken from Intl: the build runs on Node's ICU and
   the script runs on the visitor's, and those two disagree about whether
   September abbreviates to "Sep" or "Sept". The tag would then change its own
   text on load for no reason at all. */
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export interface Release {
  /** The tag exactly as GitHub carries it: `v1.0.2`. Also what is displayed. */
  version: string;
  /** The publication date, as `11 Sep 2026`. */
  date: string;
  /** The release page on GitHub. */
  url: string;
}

interface ApiRelease {
  tag_name: string;
  html_url: string;
  draft: boolean;
  prerelease: boolean;
  published_at: string | null;
  created_at: string;
}

function parse(tag: string): [number, number, number] | null {
  const m = STABLE.exec(tag);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

function higher(a: [number, number, number], b: [number, number, number]) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
}

function format(iso: string): string {
  const d = new Date(iso);
  /* UTC, so a build machine in one timezone and a reader in another are never
     one day apart on the same release. */
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/* One request per build, not one per component: the tag renders in the nav of
   every page and again under the install block. */
let pending: Promise<Release | null> | null = null;

async function ask(): Promise<Release | null> {
  try {
    const res = await fetch(API, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'svipall-site',
        /* Optional. CI has a token to spend and an anonymous build does not;
           without one the limit is 60 an hour per IP, which is ample for a
           build and is why this is not required. */
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
      /* A build must not hang on a network that is not answering. */
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) throw new Error(`GitHub answered ${res.status}`);

    const all = (await res.json()) as ApiRelease[];

    /* Highest version, not first in the list. GitHub orders by creation date,
       so a patch published to an older line would otherwise be read as the
       current release. */
    let best: { rel: ApiRelease; v: [number, number, number] } | null = null;
    for (const rel of all) {
      if (rel.draft || rel.prerelease) continue;
      const v = parse(rel.tag_name);
      if (!v) continue;
      if (!best || higher(v, best.v)) best = { rel, v };
    }

    if (!best) return null;

    return {
      version: best.rel.tag_name,
      date: format(best.rel.published_at ?? best.rel.created_at),
      url: best.rel.html_url,
    };
  } catch (err) {
    /* A warning, never a thrown error: the site builds without a version and
       the browser fills it in. Failing the build here would mean GitHub being
       briefly unreachable could stop a deploy that has nothing to do with it. */
    console.warn(
      `[release] no version baked in: ${err instanceof Error ? err.message : err}`,
    );
    return null;
  }
}

export function latestRelease(): Promise<Release | null> {
  pending ??= ask();
  return pending;
}

/* Where the tag points when there is no release to point at, and the label
   the browser script needs to know it is looking at the same repository. */
export const RELEASES_URL = `https://github.com/${REPO}/releases`;
export { REPO };
