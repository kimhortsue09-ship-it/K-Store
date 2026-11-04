import type { ReactNode } from 'react';
import { DEMO_ORDERS } from '@/data/demo';

/**
 * Enables `output: 'export'` by pre-generating the seeded demo orders. Server Component (so it can
 * export generateStaticParams) that renders its Client-Component page unchanged.
 */
export function generateStaticParams() {
  return DEMO_ORDERS.map((o) => ({ id: o.id }));
}

export default function OrderIdLayout({ children }: { children: ReactNode }) {
  return children;
}
