import type { MetadataRoute } from 'next';
import { site } from '@/config/site';

/**
 * /robots.txt — REQ-F-083, security-model.md §4.7.
 *
 * Allows all well-behaved crawlers on public pages, blocks API routes (no SEO value),
 * blocks the 404 path (no indexing of error page), blocks query-string variants
 * (prevents duplicate-content indexing for tracking parameters).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/404', '/*?*'],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
