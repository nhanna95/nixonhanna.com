import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Filenames are the URL slugs: src/content/posts/<slug>.md -> /posts/<slug>/
const posts = defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
    schema: z.object({
        title: z.string(),
        date: z.coerce.date(),
        updated: z.coerce.date().optional(),
        subtitle: z.string().optional(),
        substack: z.string().url().optional(),
        lesswrong: z.string().url().optional(),
        tags: z.array(z.string()).default([]),
        hide_feedback: z.boolean().default(false),
    }),
});

export const collections = { posts };
