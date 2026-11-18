import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PaymentDetailsSkeleton, PaymentDetailsView } from '@/features/payment-details/components/payment-details-view';

export const metadata: Metadata = { title: 'Payment details' };

/**
 * Payment details route. `params` is awaited inside Suspense so the shell is
 * prerendered and the skeleton shows instantly (Cache Components pattern).
 */
export default function PaymentDetailsPage({ params }: PageProps<'/payments/[id]'>) {
  return (
    <Suspense fallback={<PaymentDetailsSkeleton />}>
      <PaymentDetailsRoute params={params} />
    </Suspense>
  );
}

async function PaymentDetailsRoute({ params }: Pick<PageProps<'/payments/[id]'>, 'params'>) {
  const { id } = await params;
  return <PaymentDetailsView id={decodeURIComponent(id)} />;
}
