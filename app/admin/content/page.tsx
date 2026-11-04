'use client';
/**
 * Admin content — manage home banners (add / edit / delete / toggle) and the store's
 * static pages. Mirrors admin/content.js: the header "+" opens a New banner sheet, each
 * banner card has Edit / Delete plus an active toggle, and the editor validates the title,
 * picks an emoji + colour swatch, then saves. Banners persist under `nova:banners` (same key as
 * the HTML kit); wire to your backend/CMS in production. The Store pages rows link to the real
 * customer-facing static pages.
 */
import { useState } from 'react';
import Link from 'next/link';
import { config } from '@/config';
import { usePersistentState } from '@/lib/usePersistentState';
import { haptic, tgConfirm } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { Switch } from '@/components/Switch';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabBar } from '@/components/admin/AdminTabBar';

const NS = config.data.persistNamespace;

interface Banner { id: string; title: string; subtitle: string; color: string; emoji: string; active: boolean }

const COLORS = ['#00FF88', '#5B6CFF', '#F59E0B', '#EC4899', '#A855F7'];

const SEED: Banner[] = [
  { id: 'b1', title: 'Summer Sale', subtitle: 'Up to 40% off electronics', color: '#5B6CFF', emoji: '⚡', active: true },
  { id: 'b2', title: 'New Arrivals', subtitle: 'Fresh drops every week', color: '#00FF88', emoji: '✨', active: true },
];

const PAGES = [
  { name: 'Terms & Conditions', href: '/legal?doc=terms' },
  { name: 'Privacy Policy', href: '/legal?doc=privacy' },
  { name: 'Shipping & Returns', href: '/legal?doc=shipping' },
  { name: 'About', href: '/about' },
];

interface Draft { title: string; subtitle: string; emoji: string; color: string }

export default function AdminContentPage() {
  const [banners, setBanners] = usePersistentState<Banner[]>(`${NS}:banners`, SEED);
  const [editing, setEditing] = useState<Banner | null>(null); // banner being edited (null when adding)
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>({ title: '', subtitle: '', emoji: '⚡', color: COLORS[0] });

  const startEdit = (b: Banner | null) => {
    setEditing(b);
    setDraft(b
      ? { title: b.title, subtitle: b.subtitle, emoji: b.emoji, color: b.color }
      : { title: '', subtitle: '', emoji: '⚡', color: COLORS[0] });
    setOpen(true);
    haptic('selection');
  };

  const toggle = (id: string) => {
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, active: !b.active } : b)));
  };

  const remove = async (id: string) => {
    if (!(await tgConfirm('Delete this banner?'))) return;
    setBanners((prev) => prev.filter((b) => b.id !== id));
    haptic('warning');
    toast('Banner deleted');
  };

  const saveBanner = () => {
    const title = draft.title.trim();
    if (!title) { toast('Title is required', { kind: 'danger' }); haptic('error'); return; }
    const rec = { title, subtitle: draft.subtitle.trim(), emoji: draft.emoji.trim() || '⚡', color: draft.color };
    if (editing) {
      setBanners((prev) => prev.map((b) => (b.id === editing.id ? { ...b, ...rec } : b)));
    } else {
      setBanners((prev) => [...prev, { id: 'b' + Date.now().toString(36), active: true, ...rec }]);
    }
    haptic('success');
    setOpen(false);
    toast('Banner saved', { kind: 'success' });
  };

  return (
    <>
      <AdminHeader
        title="Content"
        back="/admin"
        actions={<button className="appbar__btn" aria-label="Add banner" onClick={() => startEdit(null)}><Icon name="plus" size={22} /></button>}
      />
      <main className="screen">
        <div className="admin-section-title">Home banners</div>
        <div className="container" style={{ paddingTop: 0 }}>
          {banners.length === 0 && <p className="muted text-sm">No banners yet.</p>}
          {banners.map((b) => (
            <div key={b.id} className="card card--pad" style={{ marginBottom: 12 }}>
              <div className="row gap-3">
                <div style={{ width: 56, height: 56, borderRadius: 12, background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flex: 'none' }}>{b.emoji}</div>
                <div className="grow"><div className="semibold">{b.title}</div><div className="muted text-sm">{b.subtitle}</div></div>
                <Switch checked={b.active} onChange={() => toggle(b.id)} />
              </div>
              <div className="row gap-3" style={{ marginTop: 12 }}>
                <button className="text-accent semibold text-sm" onClick={() => startEdit(b)}>Edit</button>
                <button className="semibold text-sm" style={{ color: 'var(--danger)' }} onClick={() => remove(b.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>

        <div className="admin-section-title">Store pages</div>
        <div className="list" style={{ marginTop: 0 }}>
          {PAGES.map((p) => (
            <Link key={p.name} className="data-row" href={p.href} onClick={() => haptic('selection')}>
              <span className="data-row__avatar"><Icon name="image" size={18} /></span>
              <span className="data-row__main">
                <span className="data-row__title">{p.name}</span>
                <span className="data-row__sub">Static page</span>
              </span>
              <Icon name="edit" size={18} className="text-faint" />
            </Link>
          ))}
        </div>
      </main>
      <AdminTabBar active="dashboard" />

      {open && (
        <Sheet title={editing ? 'Edit banner' : 'New banner'} onClose={() => setOpen(false)}>
          <div className="field">
            <label className="field__label" htmlFor="content-title">Title</label>
            <input id="content-title" className="input" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="content-subtitle">Subtitle</label>
            <input id="content-subtitle" className="input" value={draft.subtitle} onChange={(e) => setDraft((d) => ({ ...d, subtitle: e.target.value }))} />
          </div>
          <div className="form-grid">
            <div className="field">
              <label className="field__label" htmlFor="content-emoji">Emoji</label>
              <input id="content-emoji" className="input" value={draft.emoji} onChange={(e) => setDraft((d) => ({ ...d, emoji: e.target.value }))} />
            </div>
            <div className="field">
              <label className="field__label">Colour</label>
              <div className="swatches">
                {COLORS.map((c) => (
                  <span
                    key={c}
                    role="button"
                    tabIndex={0}
                    aria-label={`Colour ${c}`}
                    className={`swatch ${c === draft.color ? 'on' : ''}`}
                    style={{ background: c }}
                    onClick={() => { setDraft((d) => ({ ...d, color: c })); haptic('selection'); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDraft((d) => ({ ...d, color: c })); haptic('selection'); } }}
                  />
                ))}
              </div>
            </div>
          </div>
          <button className="btn btn--block" onClick={saveBanner}>{editing ? 'Save banner' : 'Add banner'}</button>
        </Sheet>
      )}
    </>
  );
}
