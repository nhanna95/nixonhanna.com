# Personal Website & Blog

An [Astro](https://astro.build) static site deployed to [Cloudflare Workers](https://developers.cloudflare.com/workers/) (static assets + a small router Worker). Uses [Bun](https://bun.sh) as the package manager/runner, with [Tailwind CSS v4](https://tailwindcss.com) and [Svelte](https://svelte.dev) islands available.

> **Migration note:** This repo was previously a Jekyll site on GitHub Pages. The old Jekyll
> sources (`_layouts/`, `_includes/`, `_posts/`, `_config.yml`, the root `*.html` pages,
> `Gemfile*`, `Rakefile`, `sitemap.xml`, `CNAME`) are still present for reference and can be
> deleted once the Cloudflare deployment is live. The Jekyll build no longer works — its
> static assets moved to `public/`.

## Structure

- `src/pages/` — pages (`about.astro` → `/about.html`, matching the old Jekyll URLs)
- `src/pages/posts/[slug]/` — blog post pages (`/posts/<slug>/`)
- `src/content/posts/` — blog posts in Markdown; **the filename is the URL slug**
- `src/layouts/` — `BaseLayout` (site chrome) and `PageLayout` (simple pages)
- `src/data/` — `media_log.yml` (Media Log page) and `tag_descriptions.yml` (tag tooltips)
- `public/` — static assets served as-is (styles.css, theme-ui.js, fonts, images, PDFs,
  and the standalone pages `/meet`, `/feedback`, `/resume`, photo projects)
- `worker/index.js` — request router: custom `/api/*` endpoints, directory indexes,
  extensionless fallbacks, and the 404 page, mirroring GitHub Pages behavior so no old URL breaks
- `wrangler.jsonc` — Cloudflare Workers config

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

### Cutover from GitHub Pages

1. `npm run deploy` to Cloudflare and verify at the workers.dev URL.
2. Move `nixonhanna.com` DNS to the Cloudflare zone (the custom domain route takes over).
3. Delete the leftover Jekyll files and disable the GitHub Pages site.

**Until DNS is moved, don't push a commit that breaks GitHub Pages** — the live site still
builds from this repo's main branch.
