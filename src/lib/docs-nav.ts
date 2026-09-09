import { getCollection } from 'astro:content';

/*
 * One source for the sidebar and the /docs index, so the two can never fall
 * out of step. The group order is fixed here rather than sorted, because the
 * reading order is a decision: what it is, then how you talk to it, then how
 * it behaves, then the evidence for all of it.
 */
const GROUPS = ['Start here', 'Interfaces', 'Behaviour', 'Evidence'] as const;

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
