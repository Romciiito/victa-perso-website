import type { MetadataRoute } from 'next';
import { site } from '@/config/site';
import { allCsPaths, enPaths } from '@/config/routes';

/**
 * /sitemap.xml — REQ-F-084, SEO-02.
 *
 * Generates one entry per canonical Czech path + the EN landing stub. Each entry
 * carries `alternates.languages` so search engines understand the cs/en pair.
 *
 * lastmod uses build time (deploy time). For granular per-page mtime tracking,
 * post-launch we can read MDX frontmatter `lastmod` and override (architecture.md §10.2).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const csEntries: MetadataRoute.Sitemap = allCsPaths().map((path) => {
    const csUrl = `${site.url}/cs${path === '/' ? '' : path}`;
    const enUrl = `${site.url}/en`;
    return {
      url: csUrl,
      lastModified,
      changeFrequency: priorityFor(path).changeFrequency,
      priority: priorityFor(path).priority,
      alternates: {
        languages: {
          cs: csUrl,
          en: enUrl,
          'x-default': csUrl,
        },
      },
    };
  });

  const enEntries: MetadataRoute.Sitemap = enPaths.map((path) => ({
    url: `${site.url}/en${path === '/' ? '' : path}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [...csEntries, ...enEntries];
}

function priorityFor(path: string): {
  changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: number;
} {
  if (path === '/') return { changeFrequency: 'weekly', priority: 1.0 };
  if (path === '/spoluprace') return { changeFrequency: 'weekly', priority: 0.95 };
  if (path === '/sluzby' || path === '/reseni' || path === '/odvetvi') {
    return { changeFrequency: 'monthly', priority: 0.85 };
  }
  if (path.startsWith('/sluzby/') || path.startsWith('/reseni/') || path.startsWith('/odvetvi/')) {
    return { changeFrequency: 'monthly', priority: 0.8 };
  }
  if (path === '/o-nas' || path === '/kontakt') {
    return { changeFrequency: 'monthly', priority: 0.7 };
  }
  if (path === '/blog') return { changeFrequency: 'monthly', priority: 0.5 };
  if (path === '/ochrana-soukromi' || path === '/cookies') {
    return { changeFrequency: 'yearly', priority: 0.3 };
  }
  return { changeFrequency: 'monthly', priority: 0.5 };
}
