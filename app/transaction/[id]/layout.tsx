import type { ReactNode } from 'react';

/**
 * Enables `output: 'export'` for wallet transaction views. The wallet module is a Client Component,
 * so its seeded demo transaction ids are mirrored here (this file is Server-only) to enumerate them
 * for static export. Renders its Client-Component page unchanged.
 */
const DEMO_TX_IDS = ['tx-1001', 'tx-1002', 'tx-1003', 'tx-1004', 'tx-1005'];

export function generateStaticParams() {
  return DEMO_TX_IDS.map((id) => ({ id }));
}

export default function TransactionIdLayout({ children }: { children: ReactNode }) {
  return children;
}
