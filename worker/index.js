import { shortLinkTarget } from './short-links.js';

// One Worker answers every hostname in wrangler.jsonc. It runs before static assets
// (assets.run_worker_first), so it sees every request, exact file matches included:
//   /meet, /feedback …       -> 302 to the short link's destination, on any host (short-links.js)
//   nixonhanna.com/<path>    -> 301 nixon.fyi/<path> (same for www., and for www.nixon.fyi)
//   nixon.blog/              -> 301 nixon.fyi/blog.html    other paths keep their path on nixon.fyi
//   nixon.contact/           -> 301 nixon.fyi/contact.html
// On nixon.fyi (and any host not listed, e.g. `wrangler dev` on localhost) it serves the build
// the way GitHub Pages served the Jekyll site:
//   /styles.css, /blog.html  -> the file itself
//   /                        -> index.html
//   /posts/x/                -> posts/x/index.html
//   /the-good-life-room      -> 301 /the-good-life-room/ (directory exists)
//   /contact                 -> contact.html (extensionless fallback)
//   anything else            -> 404.html with a 404 status

const CANONICAL_ORIGIN = 'https://nixon.fyi';

// Hosts that redirect to nixon.fyi, and the page their root lands on (else the same path).
const redirectHosts = {
    'nixonhanna.com': null,
    'www.nixonhanna.com': null,
    'www.nixon.fyi': null,
    'nixon.blog': '/blog.html',
    'www.nixon.blog': '/blog.html',
    'nixon.contact': '/contact.html',
    'www.nixon.contact': '/contact.html',
};

// Custom API endpoints, keyed by "METHOD /path". Anything under /api/ never
// collides with static assets.
const apiRoutes = {
    'GET /api/health': () => Response.json({ ok: true }),
};

// Build output under /_astro/ is content-hashed, so it never changes under the same name;
// fonts rarely do. Everything else keeps Cloudflare's default (revalidate every time).
const cacheRules = [
    [/^\/_astro\//, 'public, max-age=31536000, immutable'],
    [/^\/fonts\//, 'public, max-age=2592000'],
];

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

        if (Object.hasOwn(redirectHosts, url.hostname)) {
            const target = new URL(pathname + url.search, CANONICAL_ORIGIN);
            const root = redirectHosts[url.hostname];
            if (root && pathname === '/') target.pathname = root;
            return Response.redirect(target.href, 301);
        }

        const res = await serve(request, env, url);
        return withCaching(pathname, res);
    },
};

async function serve(request, env, url) {
    const { pathname } = url;
    // The request itself goes to the asset store, so If-None-Match still earns a 304.
    const asset = (path) => env.ASSETS.fetch(new Request(new URL(path, url.origin), request));

    const exact = await env.ASSETS.fetch(request);
    if (exact.status !== 404) return exact;

    if (pathname.endsWith('/')) {
        const res = await asset(pathname + 'index.html');
        return res.status !== 404 ? res : notFound(env, url);
    }

    // A missing file (/missing.png) is just a 404; only extensionless paths get the fallbacks.
    if (/\.[a-z0-9]+$/i.test(pathname)) return notFound(env, url);

    const page = await asset(pathname + '.html');
    if (page.status !== 404) return page;

    const indexProbe = await env.ASSETS.fetch(new URL(pathname + '/index.html', url.origin), { method: 'HEAD' });
    if (indexProbe.ok) return Response.redirect(url.origin + pathname + '/' + url.search, 301);

    return notFound(env, url);
}

function withCaching(pathname, res) {
    const rule = cacheRules.find(([pattern]) => pattern.test(pathname));
    if (!rule || res.status !== 200) return res;
    const cached = new Response(res.body, res);
    cached.headers.set('Cache-Control', rule[1]);
    return cached;
}

async function notFound(env, url) {
    const res = await env.ASSETS.fetch(new URL('/404.html', url.origin));
    return new Response(res.body, {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
}
