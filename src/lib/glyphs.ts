/*
 * The mark vocabulary: the name of every mark, and the lucide icon that draws
 * it.
 *
 * It lives in a .ts file rather than in Glyph.astro because docs-nav.ts needs
 * the NAME type to declare a mark per group, and a component importing a type
 * from a component that imports it back is a cycle waiting to be discovered by
 * someone else.
 *
 * THE NAMES ON THE LEFT ARE THE SITE'S, THE SLUGS ON THE RIGHT ARE LUCIDE'S,
 * and the indirection is the point. A call site says `name="threshold"`
 * because the row it sits on is about getting past a login wall; it does not
 * say `name="door-open"`, so swapping which lucide icon carries that idea is
 * an edit to one line of this file and to nothing else.
 *
 * These marks were hand-drawn before: a 16-unit box, 1px stroke, orthogonals
 * and 45s only. Lucide is a 24-unit box with real arcs and rounded corners.
 * Glyph.astro strips lucide's own 2px round line and redraws it with this
 * site's - 1px, square caps, mitred joins - so the set reads as a set here
 * rather than as somebody else's icons pasted in.
 */

export type GlyphName =
  // section 4 — the four faults
  | 'wall'
  | 'funnel'
  | 'unlabelled'
  | 'key'
  // section 5 — the tool family each ask exercises
  | 'read'
  | 'crawl'
  | 'table'
  | 'watch'
  | 'merge'
  | 'threshold'
  | 'document'
  // section 6 — the three reasons
  | 'machine'
  | 'measure'
  | 'struck'
  // section 3 — the three beats of one request
  | 'ask'
  | 'fetch'
  | 'reading'
  // the docs groups
  | 'enter'
  | 'prompt'
  | 'ladder'
  | 'verified'
  // navigation and links, on both surfaces
  | 'docs'
  | 'source'
  | 'onward'
  | 'find'
  | 'sourcefile';

/*
 * Each entry is the lucide icon that draws it, and the comment is the thing in
 * the copy that earns it. A mark with no line of copy behind it does not
 * belong in this table.
 */
export const ICONS: Record<GlyphName, string> = {
  // "A page can refuse and still look like it worked … including who put it
  // there when that can be identified." A shield rather than a wall: `wall`
  // and `table` were the same drawing at 16px - a grid of cells - and `table`
  // is the one of the two that has no second reading. Measured on the
  // rendered page, not decided in this file.
  wall: 'shield-ban',

  // "One page can be tens of thousands of words … poured into the answer."
  funnel: 'funnel',

  // "Filler that nobody labelled … some are the same thing you fetched twenty
  // minutes ago." Two documents, indistinguishable: nothing on either one says
  // which is which, which is the fault stated.
  unlabelled: 'files',

  // "…and no key to paste before you can search."
  key: 'key-round',

  // "Read this page and summarise the pricing."
  read: 'file-text',

  // "Crawl these docs…" — same-domain crawl: a root and what it reached.
  crawl: 'network',

  // "Get me every row of that table as a spreadsheet."
  table: 'table',

  // "Watch this listing and tell me when the price moves." The mark is on the
  // moment it moved, not on the eye watching.
  watch: 'activity',

  // "Find the three best sources … and tell me where they disagree."
  merge: 'merge',

  // "Log me in once, then keep reading the pages behind it." The answer to the
  // `wall` fault above: that one is a refusal, this one is a way through. The
  // pair is deliberate, and it is carried by the meaning rather than by two
  // versions of one drawing.
  threshold: 'door-open',

  // "Read this PDF the same way you read a web page." Blank rather than ruled,
  // which is what separates it from `read`.
  document: 'file',

  // "It runs on your machine."
  machine: 'monitor',

  // "Everything claimed here was measured — including the results that came
  // out badly."
  measure: 'chart-column',

  // "What it cannot do is written down too." Written down, and struck.
  struck: 'file-x',

  // Section 3, beat 01: "You ask" — "Read this page and tell me what it
  // costs." The mark is on the quote, because the beat is that you say it the
  // way you would say it to a person.
  ask: 'message-square-quote',

  // Beat 02: "It goes and gets it" — "gets asked again a different way, up to
  // six times". The retry is the beat, not the fetch.
  fetch: 'refresh-cw',

  // Beat 03: "Your assistant gets the reading" — the text taken off the page,
  // not the page. That distinction is the whole beat.
  reading: 'scan-text',

  // Docs group "Start here" — a way in.
  enter: 'arrow-right-to-line',

  // Docs group "Interfaces" — the command line and the local API.
  prompt: 'terminal',

  // Docs group "Behaviour" — "the tier ladder that web_fetch climbs".
  ladder: 'layers',

  // Docs group "Evidence" — every claim followed to something you can open.
  verified: 'badge-check',

  // Nav: "Docs". Twelve pages written to be read, which is not the same thing
  // as `read`, the tool that reads one page for you.
  docs: 'book-open',

  // Nav and footer: "Source". "Written in Rust … open source under AGPL-3.0."
  // Not a GitHub mark: lucide ships no brand icons, and the claim the link
  // makes is that the source is readable, not where it is hosted.
  source: 'code-xml',

  // The link at the end of a claim: "How it was measured", "What leaves your
  // machine", "What it can't do". Each one is the claim followed onward to the
  // page that carries the evidence for it.
  onward: 'arrow-right',

  // The docs search field. Local: the index ships with the site and the query
  // never leaves the browser.
  find: 'search',

  // The docs footer: "Written from <file> in the product repository." The one
  // mark on this site that names a file rather than an idea.
  sourcefile: 'file-code',
};
