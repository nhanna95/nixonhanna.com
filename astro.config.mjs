// @ts-check
import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from './worker/index.js';
import { shortLinkTarget } from './worker/short-links.js';

const publicDir = fileURLToPath(new URL('./public', import.meta.url));

// Dev-only: answer short links (/meet, /feedback …) with the same 302 the Worker sends.
/** @type {import('vite').Plugin} */
const shortLinks = {
    name: 'short-links',
    configureServer(server) {
        server.middlewares.use((req, res, next) => {
            const target = shortLinkTarget(new URL(req.url ?? '/', 'http://localhost'));
            if (!target) return next();
            res.writeHead(302, { Location: target });
            res.end();
        });
    },
};

// Dev-only: answer /api/* by running the real Worker in-process, with an in-memory stand-in for
// its KV namespace. /api/now ("Most recently…") is fetched from the live site instead (see below).
const memKV = new Map();
const devWorkerEnv = {
    NOW_KV: {
        async get(key, type) {
            const entry = memKV.get(key);
            if (!entry) return null;
            if (entry.expiresAt && Date.now() > entry.expiresAt) {
                memKV.delete(key);
                return null;
            }
            return type === 'json' ? JSON.parse(entry.value) : entry.value;
        },
        async put(key, value, opts) {
            memKV.set(key, { value, expiresAt: opts?.expirationTtl ? Date.now() + opts.expirationTtl * 1000 : null });
        },
        async delete(key) {
            memKV.delete(key);
        },
    },
};

/** @type {import('vite').Plugin} */
const devApiWorker = {
    name: 'dev-api-worker',
    configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
            if (!req.url?.startsWith('/api/')) return next();
            // /api/now comes from the live site: only it holds the Spotify connection, and a second
            // copy of the token here would get rotated out from under it. Offline, fall through to
            // the in-process Worker below (film and book, no song).
            if (req.url.startsWith('/api/now')) {
                try {
                    const live = await fetch('https://nixon.fyi/api/now', { signal: AbortSignal.timeout(5000) });
                    if (live.ok) {
                        res.setHeader('Content-Type', 'application/json');
                        res.end(await live.text());
                        return;
                    }
                } catch {
                    // offline: use the local Worker
                }
            }
            try {
                const request = new Request(`http://${req.headers.host ?? 'localhost'}${req.url}`, { method: req.method });
                const response = await worker.fetch(request, devWorkerEnv, { waitUntil() {} });
                res.statusCode = response.status;
                response.headers.forEach((value, key) => res.setHeader(key, value));
                res.end(Buffer.from(await response.arrayBuffer()));
            } catch (err) {
                next(err);
            }
        });
    },
};

// Dev-only: serve public/<dir>/index.html at /<dir>/ like the production server does
// (standalone pages: the photo projects).
/** @type {import('vite').Plugin} */
const publicDirIndex = {
    name: 'public-dir-index',
    configureServer(server) {
        server.middlewares.use((req, _res, next) => {
            const url = (req.url ?? '').split('?')[0];
            if (url.endsWith('/') && url !== '/') {
                const candidate = path.join(publicDir, url, 'index.html');
                if (candidate.startsWith(publicDir) && fs.existsSync(candidate)) {
                    req.url = url + 'index.html';
                }
            }
            next();
        });
    },
};

// https://astro.build/config
export default defineConfig({
    site: 'https://nixon.fyi',
    vite: {
        plugins: [shortLinks, devApiWorker, publicDirIndex],
    },
    // 'preserve' writes blog.astro -> blog.html and posts/[slug]/index.astro -> posts/<slug>/index.html.
    // The Worker serves them at clean URLs (/blog, /posts/<slug>/) and 301s the .html forms there.
    build: {
        format: 'preserve',
    },
    markdown: {
        // Match kramdown's footnote ids (#fn:1 used fn:1; gfm uses fn-1) minus the
        // user-content- prefix, and hide the injected "Footnotes" heading — the
        // section label is drawn by CSS (.footnotes::before) as before.
        remarkRehype: {
            clobberPrefix: '',
            footnoteLabelProperties: { className: ['footnote-label-hidden'] },
        },
    },
});
