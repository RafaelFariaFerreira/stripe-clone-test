import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { QueryProvider } from '@/lib/query-provider';
import './globals.css';

/** Public origin of the deployed app; used for absolute metadata URLs. */
const SITE_URL = 'https://stripeclone.rafaelferreira.blog';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Payments – Transactions',
    template: '%s – Transactions',
  },
  description: 'A pixel-faithful rebuild of the Stripe Dashboard Payments screen, built with Next.js and TypeScript.',
  icons: { icon: '/icon.svg' },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    title: 'Stripe Dashboard Payments clone',
    description: 'Payments list, filters and payment details rebuilt in Next.js and Angular on one shared design system.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
