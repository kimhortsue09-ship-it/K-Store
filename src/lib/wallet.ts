'use client';
/**
 * Nova Kit — Wallet transactions
 * A localStorage-backed transaction ledger with a seeded demo history. `amount` is signed
 * (+ money in, − money out); the balance is their sum. Swap for your API in production.
 */
import { useEffect } from 'react';
import { config } from '@/config';
import { usePersistentState } from './usePersistentState';

export type TxType = 'topup' | 'cashback' | 'purchase' | 'refund' | 'receive' | 'send' | 'withdraw' | 'request';

export interface Transaction {
  id: string;
  type: TxType;
  title: string;
  amount: number; // signed: + in / − out
  method?: string;
  date: string;
  status?: string;
  counterparty?: string;
  reference?: string;
}

export const TX_META: Record<TxType, { icon: string; label: string }> = {
  topup: { icon: '⬆️', label: 'Top-up' },
  cashback: { icon: '🎁', label: 'Cashback' },
  purchase: { icon: '🛍️', label: 'Purchase' },
  refund: { icon: '↩️', label: 'Refund' },
  receive: { icon: '📥', label: 'Received' },
  send: { icon: '📤', label: 'Sent' },
  withdraw: { icon: '🏦', label: 'Withdrawal' },
  request: { icon: '🧾', label: 'Payment request' },
};

const KEY = `${config.data.persistNamespace}:transactions`;

const SEED: Transaction[] = [
  { id: 'tx-1005', type: 'topup', title: 'Added money', amount: 250, method: 'Card ••4242', date: '2024-06-28T09:20:00Z', status: 'completed' },
  { id: 'tx-1004', type: 'purchase', title: 'Aurora Wireless Earbuds', amount: -89, method: 'Wallet', date: '2024-06-26T14:05:00Z', status: 'completed' },
  { id: 'tx-1003', type: 'cashback', title: 'Order cashback', amount: 4.45, method: 'Rewards', date: '2024-06-26T14:06:00Z', status: 'completed' },
  { id: 'tx-1002', type: 'receive', title: 'From Alex M.', amount: 60, method: 'Transfer', date: '2024-06-22T18:40:00Z', status: 'completed' },
  { id: 'tx-1001', type: 'withdraw', title: 'To Bank ••4471', amount: -100, method: 'Bank', date: '2024-06-19T11:00:00Z', status: 'completed' },
];

export function useTransactions() {
  const [txs, setTxs, ready] = usePersistentState<Transaction[]>(KEY, []);

  useEffect(() => {
    if (ready && txs.length === 0) setTxs(SEED);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const list = txs.length ? txs : SEED; // show seeded history immediately on first paint
  const balance = list.reduce((s, t) => s + t.amount, 0);

  const add = (tx: Omit<Transaction, 'id' | 'date' | 'status'> & { status?: string }): Transaction => {
    const full: Transaction = { id: 'tx-' + Date.now().toString(36), date: new Date().toISOString(), status: 'completed', ...tx };
    setTxs((prev) => [full, ...(prev.length ? prev : SEED)]);
    return full;
  };

  return { txs: list, balance, add, ready };
}
