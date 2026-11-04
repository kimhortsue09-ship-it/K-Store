'use client';
/** Downloads — faithful port: digital library from orders with download + reveal-key actions. Uses extra.css. */
import '../../styles/pages/extra.css';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { formatDate } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';

const MASKED = `${'•'.repeat(4)}-••••-••••`;

/** Deterministic demo licence key — mirrors the HTML kit (`NOVA-XXXX-####-7F3K`). */
function licenceKey(name: string, orderNumber: string): string {
  const slug = (name || 'X').replace(/[^A-Z0-9]/gi, '').slice(0, 4).toUpperCase();
  const digits = (orderNumber || '').replace(/\D/g, '') || '0000';
  return `NOVA-${slug}-${digits}-7F3K`;
}

export default function DownloadsPage() {
  const router = useRouter();
  const { orders, products } = useStore();
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const lib = orders
    .filter((o) => o.status !== 'cancelled')
    .flatMap((o) => o.items.filter((i) => i.type === 'digital').map((it) => {
      const p = products.find((x) => x.id === it.productId || x.name === it.name);
      return {
        name: it.name,
        emoji: it.emoji || '💾',
        date: o.createdAt,
        order: o.number,
        digital: p?.digital,
        key: licenceKey(it.name, o.number),
      };
    }));

  /** First click reveals the key; the button then becomes a Copy button. */
  const onKeyAction = async (rowKey: string, key: string) => {
    if (!revealed[rowKey]) {
      setRevealed((prev) => ({ ...prev, [rowKey]: true }));
      haptic('success');
      return;
    }
    try { await navigator.clipboard.writeText(key); } catch { /* clipboard unavailable */ }
    toast('Key copied', { kind: 'success' });
  };

  return (
    <>
      <header className="page-header"><div className="header-top">
        <button className="hbtn" aria-label="Back" onClick={() => router.push('/profile')}><Icon name="back" size={24} /></button>
        <div className="htitle"><h1>My Downloads</h1><span>{lib.length} item{lib.length === 1 ? '' : 's'}</span></div>
        <span style={{ width: 40 }} />
      </div></header>

      <main className="screen">
        {lib.length ? (
          <div className="extra-content">
            {lib.map((d, i) => {
              const rowKey = `${d.order}-${d.name}-${i}`;
              const isKeyProduct = /key/i.test(d.digital?.format || '');
              const isRevealed = !!revealed[rowKey];
              return (
                <div key={rowKey} className="dl-item" style={{ flexWrap: 'wrap' }}>
                  <div className="dl-item__icon">{d.emoji}</div>
                  <div className="dl-item__info">
                    <div className="dl-item__name">{d.name}</div>
                    <div className="dl-item__meta">{d.digital?.format || 'Digital download'} · order {d.order} · {formatDate(d.date)}</div>
                  </div>
                  {/* Real deliverables attached in admin → product editor. Files are data-URLs in
                      the demo; links open in a new tab. No assets → the demo Download button. */}
                  {d.digital?.assets?.length ? (
                    <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                      {d.digital.assets.map((a, ai) => (a.kind === 'link' ? (
                        <a
                          key={`link-${ai}-${a.url}`}
                          className="btn btn--sm btn--outline"
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => haptic('success')}
                        >
                          <Icon name="plug" size={16} /> {a.label}
                        </a>
                      ) : (
                        <a
                          key={`file-${ai}-${a.name}`}
                          className="btn btn--sm btn--outline"
                          href={a.dataUrl}
                          download={a.name}
                          onClick={() => haptic('success')}
                        >
                          <Icon name="download" size={16} /> {a.name}
                        </a>
                      )))}
                    </div>
                  ) : (
                    <button className="btn btn--sm" onClick={() => { haptic('success'); toast('Download started (demo)', { kind: 'success' }); }}>
                      <Icon name="download" size={16} /> Download
                    </button>
                  )}
                  {isKeyProduct && (
                    <div className="dl-key" style={{ flexBasis: '100%' }}>
                      <span>{isRevealed ? d.key : MASKED}</span>
                      <button className="text-accent semibold text-sm" onClick={() => void onKeyAction(rowKey, d.key)}>
                        {isRevealed ? 'Copy' : 'Reveal key'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state" style={{ paddingTop: 60 }}><div className="empty-state__emoji">📥</div><h3>No downloads yet</h3><p>Digital products you buy appear here instantly.</p><Link className="btn" href="/catalog?type=digital">Browse digital</Link></div>
        )}
      </main>
    </>
  );
}
