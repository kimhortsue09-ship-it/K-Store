import type { ReactNode } from 'react';
import { DEMO_ORDERS as STORE_ORDERS } from '@/data/demo';
import { DEMO_ORDERS as ADMIN_ORDERS } from '@/lib/admin';

/**
 * Enables `output: 'export'` for admin order views. Admin merges the shopper's orders with its own
 * demo history (see mergedOrders), so we pre-generate both sets. Server Component that renders its
 * Client-Component page unchanged.
 */
export function generateStaticParams() {
  const ids = new Set([...STORE_ORDERS, ...ADMIN_ORDERS].map((o) => o.id));
  return [...ids].map((id) => ({ id }));
}

export default function AdminOrderIdLayout({ children }: { children: ReactNode }) {
  return children;
}
