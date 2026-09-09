import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/*
 * The docs surface. C3 chose content collections over a single long page,
 * because twenty source documents in one scroll is unusable.
 *
 * `order` fixes the sidebar sequence. It is explicit rather than alphabetical
 * so the reading order can be a decision instead of an accident of naming.
 * `group` is the sidebar heading a page sits under.
 *
 * `source` is the file in the product repo this page was written from. It is
 * required, and it is the whole point: B's honesty constraint applies to the
 * docs exactly as it applies to the home, and a docs page with no source is a
 * page someone invented. It is rendered at the foot of every page.
 */
const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    group: z.enum(['Start here', 'Interfaces', 'Behaviour', 'Evidence']),
    order: z.number().int(),
    source: z.string(),
  }),
});

export const collections = { docs };
