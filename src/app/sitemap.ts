import type { MetadataRoute } from 'next';
import { site } from '@/config/site';
import { allCsPaths } from '@/config/routes';

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
  // EN routy jsou do dosažení EN parity noindex a mimo sitemap (vision §10, §14 bod 7)
  // — hreflang `en` se vrátí až s paritou, mapovaný 1:1 na skutečné EN protějšky.
  // /blog je mimo sitemap + noindex, dokud nejsou ≥ 3 články (vision §14 bod 4).
  const csEntries: MetadataRoute.Sitemap = allCsPaths()
    .filter((path) => path !== '/blog')
    .map((path) => {
      const csUrl = `${site.url}/cs${path === '/' ? '' : path}`;
      return {
        url: csUrl,
        lastModified,
        changeFrequency: priorityFor(path).changeFrequency,
        priority: priorityFor(path).priority,
        alternates: {
          languages: {
            cs: csUrl,
            'x-default': csUrl,
          },
        },
      };
    });

  return csEntries;
}

function priorityFor(path: string): {
  changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: number;
} {
  if (path === '/') return { changeFrequency: 'weekly', priority: 1.0 };
  // 0.8 dle vision §9 — audit přestal být vstupní branou, priorita odrážela starou konverzní logiku
  if (path === '/spoluprace') return { changeFrequency: 'weekly', priority: 0.8 };
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
