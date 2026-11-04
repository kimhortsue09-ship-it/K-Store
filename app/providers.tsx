'use client';
/**
 * Client providers mounted once at the app root: the Store (cart/wishlist/orders) and
 * Telegram initialisation. Add future context providers (toasts, i18n) here.
 */
import { useEffect, type ReactNode } from 'react';
import { StoreProvider } from '@/lib/store';
import { initTelegram } from '@/lib/telegram';

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    initTelegram();
  }, []);
  return <StoreProvider>{children}</StoreProvider>;
}
