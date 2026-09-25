import { shortLinkTarget } from './short-links.js';

// Static-asset router. Exact asset matches (e.g. /about.html, /styles.css) are
// served by Cloudflare before this Worker runs (html_handling: "none"); this
// only handles the misses:
//   /meet, /feedback … -> 302 to the short link's destination (short-links.js)
// and otherwise mirrors how GitHub Pages served the Jekyll site:
//   /            -> index.html
//   /posts/x/    -> posts/x/index.html
//   /resume      -> 301 /resume/ (directory exists)
//   /about       -> about.html (extensionless fallback)
//   anything else -> 404.html with a 404 status
// Custom API endpoints, keyed by "METHOD /path". Anything under /api/ never
// collides with static assets, so requests always reach this Worker.
const apiRoutes = {
    'GET /api/health': () => Response.json({ ok: true }),
};

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const { pathname } = url;

        if (pathname.startsWith('/api/')) {
            const handler = apiRoutes[`${request.method} ${pathname}`];
            if (handler) return handler(request, env, url);
            return Response.json({ error: 'not found' }, { status: 404 });
        }

        const shortLink = shortLinkTarget(url);
        if (shortLink) return Response.redirect(shortLink, 302);

        if (pathname.endsWith('/')) {
            const res = await env.ASSETS.fetch(new URL(pathname + 'index.html', url.origin));
            return res.ok ? res : notFound(env, url);
        }

        const htmlRes = await env.ASSETS.fetch(new URL(pathname + '.html', url.origin));
        if (htmlRes.ok) return htmlRes;

        const indexProbe = await env.ASSETS.fetch(new URL(pathname + '/index.html', url.origin), {
            method: 'HEAD',
        });
        if (indexProbe.ok) {
            return Response.redirect(url.origin + pathname + '/' + url.search, 301);
        }

        return notFound(env, url);
    },
};

async function notFound(env, url) {
    const res = await env.ASSETS.fetch(new URL('/404.html', url.origin));
    return new Response(res.body, {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
}
