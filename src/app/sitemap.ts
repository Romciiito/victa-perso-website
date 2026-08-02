import type { MetadataRoute } from 'next';
import { site } from '@/config/site';
import { allCsPaths, enPaths } from '@/config/routes';

/**
 * /sitemap.xml — REQ-F-084, SEO-02.
 *
 * Generates one entry per canonical Czech path AND per canonical English
 * path, each carrying `alternates.languages` so search engines understand
 * the cs/en/x-default set (vision §10: "hreflang cs+en až po paritě" — EN
 * reached full content parity in Vlna 2b-EN, so both locales are now
 * indexable and listed here; `x-default` points at the Czech URL, since
 * CS remains the primary market per vision §1/§10).
 *
 * `enPaths` mirrors `allCsPaths()` 1:1 (same slug in both locales — URL
 * structure is locale-independent, architecture.md §4.2), so each CS path
 * has a real EN counterpart at the same slug and vice versa.
 *
 * lastmod uses build time (deploy time). For granular per-page mtime tracking,
 * post-launch we can read MDX frontmatter `lastmod` and override (architecture.md §10.2).
 *
 * /blog is mimo sitemap + noindex v OBOU jazycích, dokud nejsou ≥ 3 články
 * (vision §14 bod 4) — má vlastní generateMetadata, tady se filtruje ven.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const csPaths = allCsPaths().filter((path) => path !== '/blog');
  const enPathSet = new Set(enPaths.filter((path) => path !== '/blog'));

  const entries: MetadataRoute.Sitemap = csPaths.map((path) => {
    const csUrl = `${site.url}/cs${path === '/' ? '' : path}`;
    const hasEn = enPathSet.has(path);
    const enUrl = `${site.url}/en${path === '/' ? '' : path}`;
    return {
      url: csUrl,
      lastModified,
      changeFrequency: priorityFor(path).changeFrequency,
      priority: priorityFor(path).priority,
      alternates: {
        languages: {
          cs: csUrl,
          ...(hasEn ? { en: enUrl } : {}),
          'x-default': csUrl,
        },
      },
    };
  });

  const enEntries: MetadataRoute.Sitemap = [...enPathSet].map((path) => {
    const csUrl = `${site.url}/cs${path === '/' ? '' : path}`;
    const enUrl = `${site.url}/en${path === '/' ? '' : path}`;
    return {
      url: enUrl,
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

  return [...entries, ...enEntries];
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
