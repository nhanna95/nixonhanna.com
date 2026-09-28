// "Lately…" on the home page: the last film logged on Letterboxd, the last book finished on
// Goodreads, and the last song played on Spotify. worker/index.js renders it into the home page
// as it serves it (renderNow), so it arrives with the HTML; GET /api/now returns the same data
// plus the rendered sentence (used by the page itself in `astro dev`).
//
// Letterboxd and Goodreads are public RSS: no setup. Spotify needs a one-time connect (README):
// SPOTIFY_CLIENT_ID (public, in wrangler.jsonc vars), then one visit to /api/spotify/login.
// It uses Spotify's PKCE flow, so there is no client secret to store anywhere.
//
// Results are cached in KV. After FRESH_MS the cached copy is still served, and refreshed in the
// background, so a page load never waits on the three services (except the very first one).

const FRESH_MS = 5 * 60 * 1000;
const LETTERBOXD_RSS = 'https://letterboxd.com/noxinh/rss/';
const GOODREADS_READ_RSS = 'https://www.goodreads.com/review/list_rss/173095954?shelf=read';
const UA = 'nixon.fyi lately (hello@nixonhanna.com)';

export async function nowData(env, ctx) {
    if (!env.NOW_KV) return null;
    const cached = await env.NOW_KV.get('now:payload', 'json');
    if (cached && Date.now() - cached.fetchedAt < FRESH_MS) return cached;
    const refresh = refreshNow(env);
    if (cached) {
        ctx?.waitUntil?.(refresh.catch(() => {}));
        return cached;
    }
    return refresh;
}

async function refreshNow(env) {
    const [movie, book, song] = await Promise.all([
        getMovie().catch(() => null),
        getBook().catch(() => null),
        getSong(env).catch(() => null),
    ]);
    const payload = { movie, book, song, fetchedAt: Date.now() };
    await env.NOW_KV.put('now:payload', JSON.stringify(payload));
    return payload;
}

export async function handleNow(request, env, url, ctx) {
    const data = await nowData(env, ctx);
    return Response.json({ ...data, html: renderNow(data) }, { headers: { 'Cache-Control': 'no-store' } });
}

// ---- The sentence shown on the home page, continuing its heading "Most recently…" ----
// e.g. "I watched Secretary (2002), which I gave ★★★, finished reading Make Time by Jake Knapp,
// and listened to Pink + White by Frank Ocean." Missing items are left out.

export function renderNow(data) {
    if (!data) return '';
    const link = (href, text) => (href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(text)}</a>` : esc(text));
    const by = (name) => (name ? ` by ${esc(name)}` : '');
    const { movie, book, song } = data;
    const clauses = [];
    if (movie) {
        const year = movie.year ? ` (${esc(movie.year)})` : '';
        clauses.push(`watched ${link(movie.url, movie.title)}${year}${movie.stars ? `, which I gave ${esc(movie.stars)},` : ''}`);
    }
    if (book) clauses.push(`finished reading ${link(book.url, book.title)}${by(book.author)}`);
    if (song) clauses.push(`listened to ${link(song.url, song.title)}${by(song.artist)}`);
    if (!clauses.length) return '';
    return `I ${joinClauses(clauses)}.`;
}

// "a", "a and b", "a, b, and c". The rated-movie clause already ends in a comma, so it doesn't get another.
function joinClauses(clauses) {
    if (clauses.length === 1) return clauses[0].replace(/,$/, '');
    const last = clauses.at(-1);
    const head = clauses.slice(0, -1);
    if (head.length === 1) return `${head[0]} and ${last}`;
    return `${head.map((c) => (c.endsWith(',') ? c : `${c},`)).join(' ')} and ${last}`;
}

function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// ---- Letterboxd: the newest diary entry (list entries have no filmTitle) ----

async function getMovie() {
    const xml = await fetchText(LETTERBOXD_RSS);
    for (const item of xml.split('<item>').slice(1)) {
        const title = tag(item, 'letterboxd:filmTitle');
        if (!title) continue;
        const rating = parseFloat(tag(item, 'letterboxd:memberRating') ?? '');
        return {
            title,
            year: tag(item, 'letterboxd:filmYear'),
            stars: Number.isNaN(rating) ? null : '★'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '½' : ''),
            watchedDate: tag(item, 'letterboxd:watchedDate'),
            url: tag(item, 'link'),
        };
    }
    return null;
}

// ---- Goodreads: the most recently finished book on the "read" shelf ----
// The feed is ordered by date added, not date read, so pick the latest user_read_at.

async function getBook() {
    const xml = await fetchText(GOODREADS_READ_RSS);
    let best = null;
    for (const item of xml.split('<item>').slice(1)) {
        const title = tag(item, 'title');
        if (!title) continue;
        const readAt = Date.parse(tag(item, 'user_read_at') ?? '') || Date.parse(tag(item, 'user_date_added') ?? '') || 0;
        if (!best || readAt > best.readAt) {
            best = {
                // "Make Time: How to Focus on What Matters Every Day" reads better in a sentence as "Make Time"
                title: title.split(': ')[0],
                author: tag(item, 'author_name'),
                url: (tag(item, 'link') ?? '').split('?')[0] || null, // drop the feed's utm_ tracking
                readAt,
            };
        }
    }
    return best;
}

// ---- Spotify: last played track ----

async function getSong(env) {
    const token = await spotifyAccessToken(env);
    if (!token) return null;
    const res = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const item = (await res.json()).items?.[0];
    if (!item) return null;
    return {
        title: item.track.name,
        artist: item.track.artists.map((a) => a.name).join(', '),
        url: item.track.external_urls?.spotify ?? null,
        playedAt: item.played_at,
    };
}

async function spotifyAccessToken(env) {
    if (!env.SPOTIFY_CLIENT_ID) return null;
    const cached = await env.NOW_KV.get('spotify:access_token');
    if (cached) return cached;
    const refreshToken = await env.NOW_KV.get('spotify:refresh_token');
    if (!refreshToken) return null;

    // PKCE refresh: the client id alone, no secret
    const data = await spotifyToken({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: env.SPOTIFY_CLIENT_ID });
    if (!data) return null;
    // Spotify rotates PKCE refresh tokens: keep the new one
    if (data.refresh_token) await env.NOW_KV.put('spotify:refresh_token', data.refresh_token);
    await env.NOW_KV.put('spotify:access_token', data.access_token, {
        expirationTtl: Math.max(60, (data.expires_in ?? 3600) - 60),
    });
    return data.access_token;
}

async function spotifyToken(params) {
    const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(params),
    });
    return res.ok ? res.json() : null;
}

// One-time connect flow (authorization code + PKCE): /api/spotify/login stores a random code
// verifier under a random state and redirects to Spotify's consent page; the callback checks the
// state, exchanges the code with the verifier, and stores the refresh token in KV. Once connected,
// both refuse; to reconnect, delete the spotify:refresh_token KV key first (README).

export async function handleSpotifyLogin(request, env, url) {
    if (!env.SPOTIFY_CLIENT_ID) return new Response('Set SPOTIFY_CLIENT_ID in wrangler.jsonc vars first.', { status: 500 });
    if (await env.NOW_KV.get('spotify:refresh_token')) return new Response('Spotify is already connected.', { status: 409 });
    const verifier = base64url(crypto.getRandomValues(new Uint8Array(48)));
    const state = base64url(crypto.getRandomValues(new Uint8Array(16)));
    const challenge = base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
    await env.NOW_KV.put(`spotify:pkce:${state}`, verifier, { expirationTtl: 600 });
    const authorize = new URL('https://accounts.spotify.com/authorize');
    authorize.search = new URLSearchParams({
        client_id: env.SPOTIFY_CLIENT_ID,
        response_type: 'code',
        redirect_uri: `${url.origin}/api/spotify/callback`,
        scope: 'user-read-recently-played',
        code_challenge_method: 'S256',
        code_challenge: challenge,
        state,
    }).toString();
    return Response.redirect(authorize.href, 302);
}

export async function handleSpotifyCallback(request, env, url) {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state') ?? '';
    if (!code) return new Response(`Spotify error: ${url.searchParams.get('error') ?? 'no code'}`, { status: 400 });
    if (await env.NOW_KV.get('spotify:refresh_token')) return new Response('Spotify is already connected.', { status: 409 });
    const verifier = await env.NOW_KV.get(`spotify:pkce:${state}`);
    if (!verifier) return new Response('This sign-in link expired or was already used; start again at /api/spotify/login.', { status: 400 });
    await env.NOW_KV.delete(`spotify:pkce:${state}`);
    const data = await spotifyToken({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${url.origin}/api/spotify/callback`,
        client_id: env.SPOTIFY_CLIENT_ID,
        code_verifier: verifier,
    });
    if (!data?.refresh_token) return new Response('Token exchange with Spotify failed; start again at /api/spotify/login.', { status: 502 });
    await env.NOW_KV.put('spotify:refresh_token', data.refresh_token);
    await env.NOW_KV.delete('now:payload');
    return new Response('Spotify connected. The home page will show your last-played song within a few minutes.');
}

function base64url(bytes) {
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ---- shared ----

async function fetchText(url) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    return res.text();
}

function tag(xml, name) {
    const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
    if (!m) return null;
    return decodeEntities(m[1].replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, '$1').trim()) || null;
}

// RSS text outside CDATA is entity-encoded (&amp; etc.); decode so esc() doesn't double-encode.
function decodeEntities(s) {
    return s
        .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
        .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
        .replace(/&(amp|lt|gt|quot|apos);/g, (_, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" })[e]);
}
