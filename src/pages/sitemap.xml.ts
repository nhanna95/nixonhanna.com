import type { APIRoute } from 'astro';
import { SITE_URL, isoDate, getSortedPosts, postUrl } from '../lib/site';

const staticPages = [
    { path: '/', changefreq: 'weekly', priority: '1.0' },
    { path: '/about.html', changefreq: 'monthly', priority: '0.8' },
    { path: '/blog.html', changefreq: 'weekly', priority: '0.9' },
    { path: '/contact.html', changefreq: 'monthly', priority: '0.7' },
    { path: '/media-log.html', changefreq: 'weekly', priority: '0.7' },
    { path: '/archive.html', changefreq: 'monthly', priority: '0.7' },
    { path: '/resume/', changefreq: 'monthly', priority: '0.7' },
    { path: '/meet/', changefreq: 'monthly', priority: '0.6' },
    { path: '/feedback/', changefreq: 'monthly', priority: '0.6' },
];

export const GET: APIRoute = async () => {
    const buildDate = isoDate(new Date());
    const posts = await getSortedPosts();

    const urls = [
        ...staticPages.map(
            (p) => `  <url>
    <loc>${SITE_URL}${p.path}</loc>
    <lastmod>${buildDate}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`,
        ),
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
