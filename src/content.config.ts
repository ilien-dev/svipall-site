import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

/*
 * The docs collection is Starlight's. Its files under src/content/docs/ are
 * not written by hand and not committed: scripts/sync-docs.mjs generates them
 * from the product repository on every build.
 */
export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
