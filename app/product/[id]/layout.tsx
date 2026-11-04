import type { ReactNode } from 'react';
import { products } from '@/data/catalog';

/**
 * Enables `output: 'export'` (static hosting) by pre-generating one page per catalog product.
 * This is a Server Component so it can export generateStaticParams (the page itself is a Client
 * Component). It renders children unchanged — no layout markup is added. In a normal server build
 * these product pages are simply prerendered; any other id still renders on demand.
 */
export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

export default function ProductIdLayout({ children }: { children: ReactNode }) {
  return children;
}
