import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';

/** Dashboard routes (Payments list and details) render inside the sidebar + top bar shell. */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="sr-only" href="#main-content">
        Skip to content
      </a>
      <AppShell>{children}</AppShell>
    </>
  );
}
