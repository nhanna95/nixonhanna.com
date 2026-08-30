import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';

export const SITE_URL = 'https://nixonhanna.com';
export const SITE_TITLE = 'Nixon Hanna';
export const SITE_DESCRIPTION = 'Personal website and blog';

// Per-build cache-busting version, same role as Jekyll's `site.time | date: '%s'`.
export const BUILD_V = String(Math.floor(Date.now() / 1000));

export function absoluteUrl(path: string): string {
    return new URL(path, SITE_URL).href;
}

// Jekyll: {{ date | date: '%b %-d, %Y' }} — e.g. "Nov 6, 2025".
// Front-matter dates parse as UTC midnight, so format in UTC.
export function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(date);
}

export function isoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

// Jekyll: content | strip_html | number_of_words, / 225 wpm, ceil, min 1.
export function readingTimeMinutes(markdown: string): number {
    const text = markdown
        .replace(/<[^>]+>/g, ' ') // raw HTML tags
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // images -> alt text
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links -> link text
        .replace(/[#>*_`~-]+/g, ' '); // markdown syntax
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 225));
}

// site.posts ordering: newest first; same-day posts tie-break like Jekyll
// (reverse path order on the dated filenames == reverse id order here).
export async function getSortedPosts(): Promise<CollectionEntry<'posts'>[]> {
    const posts = await getCollection('posts');
    return posts.sort(
        (a, b) => b.data.date.valueOf() - a.data.date.valueOf() || b.id.localeCompare(a.id),
    );
}

export function postUrl(post: CollectionEntry<'posts'>): string {
    return `/posts/${post.id}/`;
}
