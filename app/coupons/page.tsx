'use client';
/** Coupons — faithful port: store promo codes with copy. Uses customer.css. */
import '../../styles/pages/customer.css';
import { useRouter } from 'next/navigation';
import { config } from '@/config';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function CouponsPage() {
  const router = useRouter();
  const codes = Object.entries(config.commerce.promoCodes).map(([code, v]) => ({ code, ...v }));
  const copy = async (code: string) => { try { await navigator.clipboard.writeText(code); } catch { /* ignore */ } haptic('success'); toast(`Copied ${code}`, { kind: 'success' }); };

  return (
    <>
      <header className="appbar">
        <button className="appbar__btn" aria-label="Back" onClick={() => router.push('/profile')}><Icon name="back" size={22} /></button>
        <h1 className="appbar__title">My coupons</h1>
        <div className="appbar__actions"><ThemeToggle /></div>
      </header>

      <main className="screen">
        {codes.length ? (
          <div style={{ paddingTop: 8 }}>
            {codes.map((c) => (
              <div key={c.code} className="coupon-card">
                <span className="list-row__icon"><Icon name="tag" size={20} /></span>
                <div className="coupon-card__body">
                  <div className="semibold" style={{ fontFamily: 'ui-monospace,Menlo,Consolas,monospace', letterSpacing: '0.08em' }}>{c.code}</div>
                  <div className="muted text-sm">{c.label}</div>
                </div>
                <button className="btn btn--sm" onClick={() => copy(c.code)}>Copy</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state"><div className="empty-state__emoji">🎟️</div><h3>No coupons available</h3></div>
        )}
      </main>
    </>
  );
}
