'use client';
import Link from 'next/link';
import { ADMIN_NAV, ADMIN_PRIMARY } from '@/lib/admin';
import { cn } from '@/lib/ui';
import { Icon } from '@/components/Icon';
import { useAdminChrome } from './adminChrome';

/** Admin bottom navigation: primary sections + a "More" button opening the full drawer. */
export function AdminTabBar({ active }: { active: string }) {
  const { openDrawer } = useAdminChrome();
  const tabs = ADMIN_PRIMARY.map((id) => ADMIN_NAV.find((n) => n.id === id)).filter((n): n is (typeof ADMIN_NAV)[number] => Boolean(n));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-app border-t border-border bg-bg">
      {tabs.map((t) => (
        <Link key={t.id} href={t.href} className={cn('flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium', t.id === active ? 'text-accent' : 'text-muted')}>
          <Icon name={t.icon} size={22} filled={t.id === active} />
          {t.label}
        </Link>
      ))}
      <button onClick={openDrawer} className="flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium text-muted">
        <Icon name="grid" size={22} />
        More
      </button>
    </nav>
  );
}
