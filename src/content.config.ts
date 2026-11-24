import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        /** ISO date the facts on this page were last checked against primary sources. */
        lastVerified: z.coerce.date().optional(),
        /** Phase id (F0–F8) when the page belongs to a phase. */
        phase: z.string().regex(/^F[0-8]$/).optional(),
      }),
    }),
  }),
};
