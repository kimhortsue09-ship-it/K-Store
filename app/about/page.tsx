'use client';
/** About — faithful port: brand summary, version, links. Uses customer.css. */
import '../../styles/pages/customer.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { config } from '@/config';
import { t } from '@/lib/i18n';
import { Icon } from '@/components/Icon';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AboutPage() {
  const router = useRouter();
  return (
    <>
      <header className="appbar">
        <button className="appbar__btn" aria-label="Back" onClick={() => router.push('/profile')}><Icon name="back" size={22} /></button>
        <h1 className="appbar__title">{t('profile.about')}</h1>
        <div className="appbar__actions"><ThemeToggle /></div>
      </header>

      <main className="screen">
        <div className="about">
          <div className="about__logo">{config.brand.logoEmoji}</div>
          <h1 style={{ marginTop: 8 }}>{config.brand.name}</h1>
          <p className="muted">{config.brand.tagline}</p>
          <p className="about__ver">Version 1.0.0</p>
        </div>
        <div className="list">
          <Link className="list-row" href="/help"><span className="list-row__icon"><Icon name="help" size={20} /></span><span className="list-row__text"><span className="list-row__title">Help &amp; support</span></span><Icon name="chevron" size={18} className="text-faint" /></Link>
          <Link className="list-row" href="/legal"><span className="list-row__icon"><Icon name="info" size={20} /></span><span className="list-row__text"><span className="list-row__title">Terms &amp; privacy</span></span><Icon name="chevron" size={18} className="text-faint" /></Link>
        </div>
        <p className="muted text-sm" style={{ textAlign: 'center', padding: 24 }}>Built with the Nova Mini App Kit by {config.brand.author}.</p>
      </main>
    </>
  );
}
