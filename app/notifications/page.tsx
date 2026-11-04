'use client';
/** Notifications — faithful port: a demo feed with unread highlighting + mark-all-read. Uses customer.css. */
import '../../styles/pages/customer.css';
import { useRouter } from 'next/navigation';
import { config } from '@/config';
import { t } from '@/lib/i18n';
import { usePersistentState } from '@/lib/usePersistentState';
import { haptic } from '@/lib/telegram';
import { Icon } from '@/components/Icon';
import { ThemeToggle } from '@/components/ThemeToggle';

const NS = config.data.persistNamespace;
const FEED = [
  { id: 'n1', icon: '📦', title: 'Order delivered', body: 'Your order NV-1001 has been delivered.', time: '2h ago' },
  { id: 'n2', icon: '🎁', title: 'You earned a coupon', body: 'Use WELCOME10 for 10% off your next order.', time: '1d ago' },
  { id: 'n3', icon: '🚚', title: 'Order shipped', body: 'NV-0913 is on its way.', time: '2d ago' },
  { id: 'n4', icon: '⭐', title: 'Rate your purchase', body: 'Tell us what you think of the Pulse Smart Watch.', time: '3d ago' },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [read, setRead] = usePersistentState<string[]>(`${NS}:notif-read`, []);
  const unread = FEED.filter((n) => !read.includes(n.id)).length;

  return (
    <>
      <header className="appbar">
        <button className="appbar__btn" aria-label="Back" onClick={() => router.push('/profile')}><Icon name="back" size={22} /></button>
        <h1 className="appbar__title">{t('notifications.title')}</h1>
        <div className="appbar__actions">
          <ThemeToggle />
          {unread > 0 && <button className="appbar__btn" aria-label={t('notifications.mark_all_read')} onClick={() => { setRead(FEED.map((n) => n.id)); haptic('success'); }}><Icon name="check" size={22} /></button>}
        </div>
      </header>

      <main className="screen">
        <div style={{ paddingTop: 8 }}>
          {FEED.map((n) => (
            <div key={n.id} role="button" tabIndex={0} className={`notif ${read.includes(n.id) ? '' : 'is-unread'}`} onClick={() => { if (!read.includes(n.id)) setRead((r) => [...r, n.id]); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!read.includes(n.id)) setRead((r) => [...r, n.id]); } }}>
              <span className="notif__icon">{n.icon}</span>
              <div className="grow"><div className="semibold">{n.title}</div><div className="muted text-sm">{n.body}</div><div className="notif__time">{n.time}</div></div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
