import type { MetadataRoute } from 'next';
import { site } from '@/config/site';

/**
 * /robots.txt — REQ-F-083, security-model.md §4.7.
 *
 * Allows all well-behaved crawlers on public pages, blocks API routes (no SEO value),
 * blocks query-string variants (prevents duplicate-content indexing for tracking
 * parameters). No `/404` disallow — there's no such route (Next.js renders 404s
 * in place, on whatever path 404'd — audit P2-09); disallowing a non-existent
 * path was a no-op.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/*?*'],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
