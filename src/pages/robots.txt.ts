import type { APIRoute } from 'astro';

// Built from `site` so the Sitemap line always matches the deployed origin.
// @astrojs/sitemap writes sitemap-index.xml at the root.
export const GET: APIRoute = ({ site }) => {
  const origin = (site ?? new URL('https://artstroismolian.com')).origin;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap-index.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
