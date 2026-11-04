'use client';
/** Admin chrome context + the slide-up "all sections" drawer. */
import { createContext, useContext, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { config } from '@/config';
import { ADMIN_NAV } from '@/lib/admin';
import { Icon } from '@/components/Icon';

interface Ctx {
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}
const AdminChromeContext = createContext<Ctx | null>(null);

export function useAdminChrome(): Ctx {
  const c = useContext(AdminChromeContext);
  if (!c) throw new Error('useAdminChrome must be used within <AdminChromeProvider>');
  return c;
}

export function AdminChromeProvider({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <AdminChromeContext.Provider value={{ drawerOpen, openDrawer: () => setDrawerOpen(true), closeDrawer: () => setDrawerOpen(false) }}>
      {children}
      <AdminDrawer />
    </AdminChromeContext.Provider>
  );
}

function AdminDrawer() {
  const { drawerOpen, closeDrawer } = useAdminChrome();
  if (!drawerOpen) return null;
  return (
    <div className="sheet-overlay is-in" role="button" tabIndex={0} aria-label="Close menu" onClick={closeDrawer} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeDrawer(); } }}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__grabber" />
        <div className="sheet__head"><h3>{config.brand.name} · Admin</h3></div>
        <div className="drawer-grid">
          {ADMIN_NAV.map((n) => (
            <Link key={n.id} href={n.href} onClick={closeDrawer} className="drawer-item">
              <span className="drawer-item__icon"><Icon name={n.icon} size={22} /></span>
              <span>{n.label}</span>
            </Link>
          ))}
          <Link href="/" onClick={closeDrawer} className="drawer-item drawer-item--exit">
            <span className="drawer-item__icon"><Icon name="logout" size={22} /></span>
            <span>View storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
