import { getCollection } from 'astro:content';
import type { GlyphName } from './glyphs';

/*
 * One source for the sidebar and the /docs index, so the two can never fall
 * out of step. The group order is fixed here rather than sorted, because the
 * reading order is a decision: what it is, then how you talk to it, then how
 * it behaves, then the evidence for all of it.
 */
const GROUPS = ['Start here', 'Interfaces', 'Behaviour', 'Evidence'] as const;

/*
 * The mark for each group, declared beside the group order for the same
 * reason the order is declared here: the sidebar, the /docs index and the page
 * header all show the group name, and a mark that disagreed with itself across
 * the three would be worse than no mark at all.
 *
 * Each one names what the group IS, not what a documentation section
 * generally looks like:
 *   Start here  a way in
 *   Interfaces  the prompt caret - the command line and the local API
 *   Behaviour   the tier ladder web_fetch climbs when a page refuses
 *   Evidence    every claim followed to something a reader can open
 */
export const GROUP_MARKS: Record<(typeof GROUPS)[number], GlyphName> = {
  'Start here': 'enter',
  Interfaces: 'prompt',
  Behaviour: 'ladder',
  Evidence: 'verified',
};

export async function docsNav() {
  const pages = await getCollection('docs');
  const sorted = [...pages].sort((a, b) => a.data.order - b.data.order);

  return GROUPS.map((name) => ({
    name,
    pages: sorted
      .filter((page) => page.data.group === name)
      .map((page) => ({
        id: page.id,
        title: page.data.title,
        summary: page.data.summary,
      })),
  })).filter((group) => group.pages.length > 0);
}
