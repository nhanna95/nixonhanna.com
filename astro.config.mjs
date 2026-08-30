// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const publicDir = fileURLToPath(new URL('./public', import.meta.url));

// Dev-only: serve public/<dir>/index.html at /<dir>/ like the production server does
// (standalone pages: /meet/, /feedback/, /resume/, photo projects).
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
    site: 'https://nixonhanna.com',
    integrations: [svelte()],
    vite: {
        plugins: [publicDirIndex, tailwindcss()],
    },
    // 'preserve' keeps the Jekyll-era URLs working unchanged: about.astro -> /about.html,
    // posts/[slug]/index.astro -> /posts/<slug>/index.html.
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
