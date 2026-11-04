'use client';
/** Deals / Flash Sale — faithful port: countdown hero + discounted product grid. Uses extra.css. */
import '../../styles/pages/extra.css';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { Icon } from '@/components/Icon';
import { ProductCard } from '@/components/ProductCard';

const pad = (n: number) => String(n).padStart(2, '0');

export default function DealsPage() {
  const router = useRouter();
  const { products } = useStore();
  const deals = products.filter((p) => p.originalPrice).sort((a, b) => ((1 - a.price / (a.originalPrice || 1)) < (1 - b.price / (b.originalPrice || 1)) ? 1 : -1));
  const maxOff = deals.length ? Math.round(Math.max(...deals.map((p) => 1 - p.price / (p.originalPrice || 1))) * 100) : 0;
  const [cd, setCd] = useState('00:00:00');

  useEffect(() => {
    const end = new Date();
    end.setHours(24, 0, 0, 0);
    const tick = () => {
      let s = Math.max(0, Math.floor((end.getTime() - Date.now()) / 1000));
      const h = Math.floor(s / 3600); s %= 3600;
      const m = Math.floor(s / 60); s %= 60;
      setCd(`${pad(h)}:${pad(m)}:${pad(s)}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <header className="page-header"><div className="header-top">
        <button className="hbtn" aria-label="Back" onClick={() => router.push('/')}><Icon name="back" size={24} /></button>
        <div className="htitle"><h1>Deals</h1><span>Limited-time offers</span></div>
        <span style={{ width: 40 }} />
      </div></header>

      <main className="screen">
        <div className="deals-hero">
          <h2>⚡ Flash Sale</h2>
          <p>Up to {maxOff}% off — ends in</p>
          <div className="deals-countdown">{cd.split(':').map((x, i) => <span key={i}>{x}</span>)}</div>
        </div>
        {deals.length ? (
          <div className="pcard-grid" style={{ paddingTop: 8 }}>{deals.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        ) : (
          <div className="empty-state"><div className="empty-state__emoji">🏷️</div><h3>No active deals</h3><Link className="btn" href="/catalog">{t('nav.catalog')}</Link></div>
        )}
        <div style={{ height: 24 }} />
      </main>
    </>
  );
}
