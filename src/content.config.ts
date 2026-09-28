import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

// One content record drives the home page, archive, and project detail page.
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string().min(1),
    coverTitle: z.string().min(1).optional(),
    summary: z.string().min(1),
    category: z.string().min(1),
    year: z.number().int().min(2000),
    role: z.string().min(1),
    stack: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    order: z.number().default(100),
    draft: z.boolean().default(true),
    sample: z.boolean().default(false),
    theme: z.enum(['forest', 'paper']).default('forest'),
    cover: z
      .object({
        src: z.string().startsWith('/images/'),
        fit: z.enum(['cover', 'contain']).default('cover'),
        alt: z.string().min(1),
      })
      .optional(),
    gallery: z
      .array(
        z.object({
          src: z.string().startsWith('/images/'),
          alt: z.string().min(1),
          caption: z.string().optional(),
        }),
      )
      .default([]),
    websiteLabel: z.string().min(1).optional(),
    website: z.url({ protocol: /^https$/ }).optional(),
    github: z.url({ protocol: /^https$/ }).optional(),
  }),
});
export const collections = { projects };
