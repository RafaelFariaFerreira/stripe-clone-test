import type { Metadata } from 'next';
import { StyleGuide } from '@/features/styleguide/style-guide';

export const metadata: Metadata = {
  title: 'Design system',
  description:
    'Style guide and component documentation for the Stripe Payments clone: tokens, typography, icons and every component with live demos.',
};

/** Team-facing style guide, prerendered at build time. */
export default function StyleGuidePage() {
  return <StyleGuide />;
}
