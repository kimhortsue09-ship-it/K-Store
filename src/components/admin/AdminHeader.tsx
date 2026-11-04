'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { config } from '@/config';
import { Icon } from '@/components/Icon';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAdminChrome } from './adminChrome';

/** Admin top bar — real `.appbar.admin-appbar` markup: back link or drawer menu, title, actions. */
export function AdminHeader({ title, back, actions }: { title: string; back?: string; actions?: ReactNode }) {
  const { openDrawer } = useAdminChrome();
  return (
    <header className="appbar admin-appbar">
      {back ? (
        <Link href={back} aria-label="Back" className="appbar__btn"><Icon name="back" size={22} /></Link>
      ) : (
        <button onClick={openDrawer} aria-label="Menu" className="appbar__btn"><Icon name="grid" size={22} /></button>
      )}
      <h1 className="appbar__title">{title}</h1>
      <div className="appbar__actions">
        {config.theme.allowUserToggle && <ThemeToggle />}
        {actions}
      </div>
    </header>
  );
}
