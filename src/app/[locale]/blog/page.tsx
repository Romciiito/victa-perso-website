import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { EnglishStub } from '@/components/en-stub';
import { BlogBody } from './blog-body';

type Props = { params: Promise<{ locale: string }> };

// Blog je noindex + mimo sitemap, dokud nejsou publikovány ≥ 3 články (vision §14 bod 4)
// — návštěvník ze SERPu nesmí přistát na prázdném blogu.
export function generateMetadata(): Metadata {
  return {
    title: 'Blog — VICTA',
    robots: { index: false, follow: true },
  };
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (locale === 'en') {
    return <EnglishStub title="Blog." pathLabel="/en/blog" />;
  }

  return <BlogBody />;
}
