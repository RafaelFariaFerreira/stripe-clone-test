import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AnnouncementBanner } from '@/features/payments/components/announcement-banner';
import { PaymentsPageHeader } from '@/features/payments/components/page-header';
import { PaymentsView, PaymentsViewFallback } from '@/features/payments/components/payments-view';

export const metadata: Metadata = { title: 'Payments' };

/**
 * Payments list. The header, tabs and banner are part of the prerendered
 * static shell; the URL-driven table streams in inside the Suspense boundary.
 */
export default function PaymentsPage() {
  return (
    <>
      <PaymentsPageHeader />
      <AnnouncementBanner />
      <Suspense fallback={<PaymentsViewFallback />}>
        <PaymentsView />
      </Suspense>
    </>
  );
}
