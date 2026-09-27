# Personal Website & Blog

An [Astro](https://astro.build) static site deployed to [Cloudflare Workers](https://developers.cloudflare.com/workers/) (static assets + a small router Worker). Uses [Bun](https://bun.sh) as the package manager/runner, with [Tailwind CSS v4](https://tailwindcss.com) and [Svelte](https://svelte.dev) islands available.

> **Migration note:** This repo was previously a Jekyll site on GitHub Pages. The migration is
> complete and the Jekyll sources have been removed.

## Structure

- `src/pages/` — pages (`contact.astro` → `/contact.html`, matching the old Jekyll URLs)
- `src/pages/posts/[slug]/` — blog post pages (`/posts/<slug>/`)
- `src/content/posts/` — blog posts in Markdown; **the filename is the URL slug**
- `src/layouts/` — `BaseLayout` (site chrome) and `PageLayout` (simple pages)
- `src/data/` — `tag_descriptions.yml` (tag tooltips)
- `public/` — static assets served as-is (styles.css, site.js, fonts, images, PDFs,
  and the standalone pages `/resume`, photo projects)
- `worker/index.js` — request router: custom `/api/*` endpoints, short links, directory indexes,
  extensionless fallbacks, and the 404 page, mirroring GitHub Pages behavior so no old URL breaks
- `worker/short-links.js` — short links (`/meet`, `/feedback`) and their destinations
- `wrangler.jsonc` — Cloudflare Workers config

## Short links

`nixonhanna.com/meet` and `/feedback` are 302 redirects answered by the Worker (and by the dev
server). To add one, add a line to the `shortLinks` table in
[worker/short-links.js](worker/short-links.js) and deploy. Matching ignores case and trailing
slashes, and any sub-path or query string is passed along (`/meet/30min` →
`cal.com/nixon-hanna/30min`).

## Tailwind, Svelte, API endpoints

- **Tailwind v4** is wired through `@tailwindcss/vite` and imported in `BaseLayout`
  ([src/styles/tailwind.css](src/styles/tailwind.css)) — **without preflight**, so the existing
  `public/styles.css` design is untouched. Utility classes work in any template.
- **Svelte islands**: put components in `src/components/*.svelte` and mount with
  `<MyComponent client:load />` (see [Counter.svelte](src/components/Counter.svelte) for an
  example). Pages without islands ship zero JS.
- **Custom endpoints**: add handlers to the `apiRoutes` table in
  [worker/index.js](worker/index.js) (`'GET /api/health'` is a working example). `/api/*`
  never collides with static assets, so those requests always reach the Worker.
- Markdown uses the classic remark pipeline (`@astrojs/markdown-remark`, opt-in since
  Astro 7) so footnote markup keeps matching the site CSS.

## Writing a post

Add `src/content/posts/my-post-slug.md`:

```markdown
---
title: "My Post Title"
date: 2026-09-01
tags: [Reflections]          # optional
substack: https://…          # optional "also on Substack" callout
updated: 2026-09-05          # optional
subtitle: "…"                # optional
hide_feedback: true          # optional, hides the feedback footer line
---

Post body in Markdown (GFM + footnotes supported).
```

It publishes at `/posts/my-post-slug/` and appears on the blog page and sitemap automatically.

## Local development

```bash
bun install
bun run dev        # Astro dev server at http://localhost:4321
bun run cf:dev     # production build served by wrangler dev (tests the Worker routing)
```

## Deploy

One-time setup: `bunx wrangler login`, and make sure the `nixonhanna.com` zone is on the
Cloudflare account (the custom-domain routes in `wrangler.jsonc` attach automatically on
deploy).

```bash
bun run deploy     # astro build && wrangler deploy
```

### Preview host (nixon.fyi)

A second Worker (`env.fyi` in `wrangler.jsonc`) serves the `redesign` branch at
`nixon.fyi` while `main` stays on `nixonhanna.com`. One-time: add the `nixon.fyi` zone to
the same Cloudflare account. Then, from the branch:

```bash
bun run deploy:fyi   # SITE_URL=https://nixon.fyi astro build && wrangler deploy --env fyi
```

The preview build sets canonical/og/sitemap URLs to nixon.fyi and adds a `noindex` meta so
search engines don't index a duplicate. To ship the redesign, merge into `main` and
`bun run deploy` as usual.

### Cutover from GitHub Pages

Done: DNS points to Cloudflare, and the GitHub Pages site and its Jekyll workflow are gone.
Pushing to `main` doesn't deploy anything; only `bun run deploy` does.
