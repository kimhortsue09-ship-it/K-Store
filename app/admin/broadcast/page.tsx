'use client';
/**
 * Admin broadcast — compose and send a push/message broadcast to a customer segment, with a
 * live message preview and a history of past broadcasts. Mirrors admin/broadcast.js: pick an
 * audience chip, fill title/message + optional CTA, preview updates live, and Send confirms
 * then prepends the send to history. In-memory demo state. Uses admin.css.
 */
import { useMemo, useState } from 'react';
import { config } from '@/config';
import { formatDate, formatNumber } from '@/lib/format';
import { haptic, tgConfirm } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { AdminHeader } from '@/components/admin/AdminHeader';

interface Segment { id: string; label: string; count: number }
interface Broadcast { title: string; segment: string; reach: number; date: string; status: string }

const SEGMENTS: Segment[] = [
  { id: 'all', label: 'All users', count: 2890 },
  { id: 'active', label: 'Active (30d)', count: 1740 },
  { id: 'buyers', label: 'With orders', count: 1234 },
  { id: 'wishlist', label: 'Has wishlist', count: 612 },
];

const SEED_HISTORY: Broadcast[] = [
  { title: 'Summer sale is live 🌞', segment: 'All users', reach: 2890, date: '2024-06-28', status: 'sent' },
  { title: 'Your cart misses you 🛒', segment: 'Has wishlist', reach: 590, date: '2024-06-20', status: 'sent' },
];

export default function AdminBroadcastPage() {
  const [segment, setSegment] = useState<string>('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [btnLabel, setBtnLabel] = useState('');
  const [btnUrl, setBtnUrl] = useState('');
  const [history, setHistory] = useState<Broadcast[]>(SEED_HISTORY);

  const audience = useMemo(() => SEGMENTS.find((s) => s.id === segment) ?? SEGMENTS[0], [segment]);

  const pickSegment = (id: string) => { setSegment(id); haptic('selection'); };

  const send = async () => {
    if (!title.trim() || !body.trim()) { toast('Add a title and message', { kind: 'danger' }); haptic('error'); return; }
    if (!(await tgConfirm(`Send this broadcast to ${formatNumber(audience.count)} ${audience.label} users?`))) return;
    setHistory((prev) => [
      { title: title.trim(), segment: audience.label, reach: audience.count, date: new Date().toISOString().slice(0, 10), status: 'sent' },
      ...prev,
    ]);
    setTitle(''); setBody(''); setBtnLabel(''); setBtnUrl('');
    haptic('success');
    toast('Broadcast sent (demo)', { kind: 'success' });
  };

  return (
    <>
      <AdminHeader title="Broadcast" back="/admin" />
      <main className="screen">
        <div className="container" style={{ paddingTop: 16 }}>
          <div className="field__label">Audience</div>
          <div className="chip-row" style={{ paddingInline: 0 }}>
            {SEGMENTS.map((s) => (
              <button key={s.id} className={`chip${segment === s.id ? ' is-active' : ''}`} onClick={() => pickSegment(s.id)}>
                {s.label} · {formatNumber(s.count)}
              </button>
            ))}
          </div>

          <div className="field" style={{ marginTop: 8 }}>
            <label className="field__label" htmlFor="bc-title">Title</label>
            <input id="bc-title" className="input" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekend flash sale" />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="bc-body">Message</label>
            <textarea id="bc-body" className="textarea" maxLength={1000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your announcement…" />
          </div>

          <div className="admin-section-title" style={{ paddingInline: 0 }}>Call-to-action (optional)</div>
          <div className="form-grid">
            <div className="field"><label className="field__label" htmlFor="bc-btn-label">Button label</label><input id="bc-btn-label" className="input" value={btnLabel} onChange={(e) => setBtnLabel(e.target.value)} placeholder="Shop now" /></div>
            <div className="field"><label className="field__label" htmlFor="bc-btn-url">Button link</label><input id="bc-btn-url" className="input" value={btnUrl} onChange={(e) => setBtnUrl(e.target.value)} placeholder="catalog.html" /></div>
          </div>

          <div className="admin-section-title" style={{ paddingInline: 0 }}>Preview</div>
          <div className="bc-preview">
            <div className="bc-preview__app">{config.brand.logoEmoji} {config.brand.name}</div>
            <div className="bc-preview__title">{title || 'Message title'}</div>
            <div className="bc-preview__body">{body || 'Your message text will appear here.'}</div>
            {btnLabel && <div className="bc-preview__btn">{btnLabel}</div>}
          </div>

          <div className="admin-section-title" style={{ paddingInline: 0 }}>Recent broadcasts</div>
          <div className="list" style={{ margin: 0 }}>
            {history.map((h, i) => (
              <div key={`${h.title}-${i}`} className="data-row">
                <span className="data-row__avatar"><Icon name="send" size={18} /></span>
                <span className="data-row__main">
                  <span className="data-row__title">{h.title}</span>
                  <span className="data-row__sub">{h.segment} · {formatDate(h.date)}</span>
                </span>
                <span className="data-row__end">
                  <span className="semibold">{formatNumber(h.reach)}</span>
                  <span className="status status--delivered">{h.status}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <div className="bottom-bar">
        <button className="btn btn--block" onClick={send}><Icon name="send" size={18} /> Send to {formatNumber(audience.count)} users</button>
      </div>
    </>
  );
}
