'use client';
import Link from 'next/link';
import { config } from '@/config';
import { t } from '@/lib/i18n';
import { Icon } from '@/components/Icon';
import { ThemeToggle } from '@/components/ThemeToggle';

/** 404 — Next.js renders this for any unmatched route. */
export default function NotFound() {
  return (
    <>
      <header className="appbar">
        <Link className="appbar__btn" href="/" aria-label={t('action.back')}><Icon name="back" size={22} /></Link>
        <h1 className="appbar__title">{config.brand.name}</h1>
        <div className="appbar__actions"><ThemeToggle /></div>
      </header>

      <main className="screen screen--no-tabbar">
        <div className="empty-state" style={{ minHeight: '70dvh', justifyContent: 'center' }}>
          <div className="empty-state__emoji" style={{ fontSize: 64 }}>🧭</div>
          <h3>Page not found</h3>
          <p>The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
          <Link className="btn" href="/">{t('nav.home')}</Link>
        </div>
      </main>
    </>
  );
}
