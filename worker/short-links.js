// Short links: nixonhanna.com/<name> -> external URL. The Worker (worker/index.js) and the
// dev server (astro.config.mjs) both answer them with a 302 straight to the destination.
// Matching ignores case and trailing slashes; any sub-path and query string are passed
// along, so /meet/30min goes to https://cal.com/nixon-hanna/30min.
// 302 rather than 301: browsers cache a 301 indefinitely, so changing a destination here
// would never reach anyone who had already followed the old one.
export const shortLinks = {
    meet: 'https://cal.com/nixon-hanna',
    feedback: 'https://www.admonymous.co/nixon',
};

// The destination for a short-link request URL, or null if the path isn't a short link.
export function shortLinkTarget(url) {
    const [, name = '', ...rest] = url.pathname.split('/');
    const key = name.toLowerCase();
    if (!Object.hasOwn(shortLinks, key)) return null;

    const dest = new URL(shortLinks[key]);
    const subpath = rest.filter(Boolean).join('/');
    if (subpath) dest.pathname = `${dest.pathname.replace(/\/$/, '')}/${subpath}`;
    url.searchParams.forEach((value, param) => dest.searchParams.append(param, value));
    return dest.href;
}
