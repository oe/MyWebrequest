import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\nSitemap: ${new URL('MyWebrequest/sitemap-index.xml', site)}\n`, {
    headers: { 'Content-Type': 'text/plain' },
  });
