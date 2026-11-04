'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { config } from '@/config';
import { useStore } from '@/lib/store';
import { Icon } from './Icon';

/**
 * Bottom navigation — real Nova Kit `.tabbar` markup, config-driven, with wishlist/orders badges.
 * `activeTab` forces a tab id to be highlighted for pages that live outside a tab's route
 * (e.g. /settings belongs to Profile) — mirrors the HTML edition's `tabBar('profile')`.
 */
export function TabBar({ activeTab }: { activeTab?: string } = {}) {
  const path = usePathname();
  const { wishlist, orders } = useStore();
  const badges: Record<string, number> = { wishlist: wishlist.length, orders: orders.length };

  return (
    <nav className="tabbar" role="navigation">
      {config.nav.tabs.map((tab) => {
        const active = activeTab ? tab.id === activeTab : tab.href === '/' ? path === '/' : path.startsWith(tab.href);
        const badge = badges[tab.id];
        return (
          <Link key={tab.id} href={tab.href} className={`tabbar__item${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>
            <span className="tabbar__icon">
              <Icon name={tab.icon} size={24} filled={active} />
              {badge ? <span className="tabbar__badge">{badge}</span> : null}
            </span>
            <span className="tabbar__label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
