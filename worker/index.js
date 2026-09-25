// Static-asset router. Exact asset matches (e.g. /contact.html, /styles.css) are
// served by Cloudflare before this Worker runs (html_handling: "none"); this
// only handles the misses, mirroring how GitHub Pages served the Jekyll site:
//   /            -> index.html
//   /posts/x/    -> posts/x/index.html
//   /meet        -> 301 /meet/ (directory exists)
//   /contact     -> contact.html (extensionless fallback)
//   anything else -> 404.html with a 404 status
// Custom API endpoints, keyed by "METHOD /path". Anything under /api/ never
// collides with static assets, so requests always reach this Worker.
const apiRoutes = {
    'GET /api/health': () => Response.json({ ok: true }),
};

// Vanity hosts: their root serves a specific page from the same build. Every other
// path (posts, styles, /meet …) works on them exactly as on the main host.
const hostRoots = {
    'nixon.blog': '/blog.html',
    'www.nixon.blog': '/blog.html',
    'nixon.contact': '/contact.html',
    'www.nixon.contact': '/contact.html',
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

        if (pathname === '/' && hostRoots[url.hostname]) {
            const res = await env.ASSETS.fetch(new URL(hostRoots[url.hostname], url.origin));
            return res.ok ? res : notFound(env, url);
        }

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
