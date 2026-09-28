# Personal Website & Blog

An [Astro](https://astro.build) static site served at **nixon.fyi** from [Cloudflare Workers](https://developers.cloudflare.com/workers/) (static assets + a small router Worker). Uses [Bun](https://bun.sh) as the package manager/runner.

## Structure

- `src/pages/` — pages (`contact.astro` → `/contact`; the build writes `contact.html`, the Worker serves it without the extension)
- `src/pages/posts/[slug]/` — blog post pages (`/posts/<slug>/`)
- `src/content/posts/` — blog posts in Markdown; **the filename is the URL slug**
- `src/layouts/` — `BaseLayout` (site chrome) and `PageLayout` (simple pages)
- `src/data/` — `archive.ts` (archive entries) and `tag_descriptions.yml` (tag tooltips)
- `public/` — static assets served as-is (styles.css, site.js, fonts, images, PDFs, and the
  standalone photo projects `/the-river-feels-colder-this-time/` and `/the-good-life-room/`)
- `worker/index.js` — request router: host redirects, short links, custom `/api/*` endpoints,
  directory indexes, extensionless fallbacks, and the 404 page
- `worker/short-links.js` — short links (`/meet`, `/feedback`) and their destinations
- `wrangler.jsonc` — Cloudflare Workers config (every hostname routes to the one Worker)
- `docs/` — notes that aren't published (e.g. the Good Life Room hotspot drafts)

## Domains

nixon.fyi serves the site. The Worker runs before static assets, so it sees every request:

- `nixonhanna.com/<path>` (and `www.`) → 301 to `nixon.fyi/<path>`
- `nixon.blog` → 301 to `nixon.fyi/blog`, `nixon.contact` → `nixon.fyi/contact`
  (other paths on those hosts keep their path on nixon.fyi); `www.nixon.fyi` → `nixon.fyi`
- the short links answer on every host, so `nixonhanna.com/meet` and `/feedback` still work
- pages have clean URLs: `/blog.html` → 301 `/blog`, `/posts/x/index.html` → 301 `/posts/x/`

## Short links

`/meet` and `/feedback` are 302 redirects answered by the Worker (and by the dev server). To
add one, add a line to the `shortLinks` table in [worker/short-links.js](worker/short-links.js)
and deploy. Matching ignores case and trailing slashes, and any sub-path or query string is
passed along (`/meet/30min` → `cal.com/nixon-hanna/30min`).

## "Most recently…" (home page)

The home page's last-watched film, last-read book and last-played song come from
[worker/now.js](worker/now.js). The Worker fills the section in as it serves `/` (so it arrives
with the page), caches the data in KV (`NOW_KV`, refreshed in the background every 5 minutes), and
also serves it at `/api/now`. In `astro dev` the page fetches `/api/now` itself.

- **Letterboxd** (latest diary entry + rating) and **Goodreads** (latest finished book on the
  "read" shelf): public RSS, no setup.
- **Spotify** (last played track): connected once through Spotify's PKCE sign-in, so there's no
  client secret anywhere. The app lives at developer.spotify.com/dashboard (redirect URI
  `https://nixon.fyi/api/spotify/callback`); its public client ID is `SPOTIFY_CLIENT_ID` in
  `wrangler.jsonc` vars. To connect, visit `https://nixon.fyi/api/spotify/login` and approve; the
  refresh token is stored in KV. To reconnect later:
  `bunx wrangler kv key delete --namespace-id 74a36f9dcd1141009aefe01ea4375d96 "spotify:refresh_token"`,
  then visit the login URL again. Spotify refresh tokens last 180 days, so expect to reconnect
  about twice a year (the song line quietly disappears when the connection lapses). Spotify's
  2026 rules also require the app owner's account to have Premium.

## API endpoints and Markdown

- **Custom endpoints**: add handlers to the `apiRoutes` table in
  [worker/index.js](worker/index.js) (`'GET /api/health'` is a working example).
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

One-time setup: `bunx wrangler login`, with the nixon.fyi, nixonhanna.com, nixon.blog and
nixon.contact zones on the same Cloudflare account. This deploys the `nixon-fyi` Worker; the
custom-domain routes in `wrangler.jsonc` attach on deploy.

```bash
bun run deploy     # astro build && wrangler deploy
```

Pushing to `main` doesn't deploy anything; only `bun run deploy` does.
