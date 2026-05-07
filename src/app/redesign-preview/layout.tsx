import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './preview.css';

const geistSans = Geist({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-geist-mono-pv',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VICTA · taste-skill preview',
  description:
    'Sandbox redesign exploration. Locked design tokens are not affected.',
  robots: { index: false, follow: false },
};

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} preview-root pv-grain`}>
        {children}
      </body>
    </html>
  );
}
