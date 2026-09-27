import type { APIRoute } from 'astro';
import { SITE_URL, isoDate, getSortedPosts, lastChanged, postUrl } from '../lib/site';

// Every indexable page: the Astro pages, the standalone photo projects in public/, and the posts.
// `source` is the file whose last change dates the page (see lastChanged).
const staticPages = [
    { path: '/', source: 'src/pages/index.astro', changefreq: 'weekly', priority: '1.0' },
    { path: '/blog.html', source: 'src/pages/blog.astro', changefreq: 'weekly', priority: '0.9' },
    { path: '/contact.html', source: 'src/pages/contact.astro', changefreq: 'monthly', priority: '0.7' },
    { path: '/archive.html', source: 'src/data/archive.ts', changefreq: 'monthly', priority: '0.7' },
    { path: '/the-river-feels-colder-this-time/', source: 'public/the-river-feels-colder-this-time/index.html', changefreq: 'yearly', priority: '0.6' },
    { path: '/the-good-life-room/', source: 'public/the-good-life-room/index.html', changefreq: 'yearly', priority: '0.6' },
];

export const GET: APIRoute = async () => {
    const posts = await getSortedPosts();
    const newestPost = posts[0]?.data.date;

    const urls = [
        ...staticPages.map((p) => {
            let lastmod = lastChanged(p.source);
            // The blog index also changes whenever a post is published.
            if (p.path === '/blog.html' && newestPost && newestPost > lastmod) lastmod = newestPost;
            return `  <url>
    <loc>${SITE_URL}${p.path}</loc>
    <lastmod>${isoDate(lastmod)}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`;
        }),
        ...posts.map(
            (post) => `  <url>
    <loc>${SITE_URL}${postUrl(post)}</loc>
    <lastmod>${isoDate(post.data.updated ?? post.data.date)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`,
        ),
    ];

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

    return new Response(body, {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
};
