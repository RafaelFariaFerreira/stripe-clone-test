import type { Routes } from '@angular/router';

/** Every page is lazy loaded, so the initial bundle only holds the shell. */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'payments' },
  {
    path: 'payments',
    title: 'Payments – Transactions',
    loadComponent: () => import('./features/payments/payments-page').then((m) => m.PaymentsPage),
  },
  {
    path: 'payments/:id',
    title: 'Payment details – Transactions',
    loadComponent: () => import('./features/payment-details/payment-details-page').then((m) => m.PaymentDetailsPage),
  },
  { path: '**', title: 'Page not found', loadComponent: () => import('./not-found').then((m) => m.NotFound) },
];
