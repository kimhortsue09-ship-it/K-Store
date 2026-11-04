'use client';
/** Admin collections — curated product groups (visible/featured toggles, edit). Uses admin.css. */
import { useState } from 'react';
import { haptic, tgConfirm } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { Switch } from '@/components/Switch';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabBar } from '@/components/admin/AdminTabBar';

interface Coll { id: string; name: string; emoji: string; desc: string; count: number; visible: boolean; featured: boolean }
const SEED: Coll[] = [
  { id: 'c1', name: 'New Arrivals', emoji: '✨', desc: 'The latest additions to the store', count: 12, visible: true, featured: true },
  { id: 'c2', name: 'Staff Picks', emoji: '⭐', desc: 'Hand-selected favourites', count: 8, visible: true, featured: false },
  { id: 'c3', name: 'Best Sellers', emoji: '🔥', desc: 'Most popular this month', count: 15, visible: true, featured: true },
  { id: 'c4', name: 'Clearance', emoji: '🏷️', desc: 'Last chance deals', count: 6, visible: false, featured: false },
];

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Coll[]>(SEED);
  const [editing, setEditing] = useState<Coll | null>(null);
  const [form, setForm] = useState({ name: '', emoji: '✨', desc: '', count: '0', featured: false });

  const openEdit = (c: Coll | null) => { setEditing(c ?? ({ id: '', name: '', emoji: '✨', desc: '', count: 0, visible: true, featured: false })); setForm({ name: c?.name ?? '', emoji: c?.emoji ?? '✨', desc: c?.desc ?? '', count: String(c?.count ?? 0), featured: c?.featured ?? false }); };
  const submit = () => {
    if (!form.name.trim()) { toast('Name is required', { kind: 'danger' }); return; }
    const data = { name: form.name.trim(), emoji: form.emoji || '✨', desc: form.desc, count: +form.count || 0, featured: form.featured };
    setCollections((prev) => editing?.id ? prev.map((c) => (c.id === editing.id ? { ...c, ...data } : c)) : [{ id: 'c' + Date.now().toString(36), visible: true, ...data }, ...prev]);
    haptic('success'); setEditing(null); toast('Collection saved', { kind: 'success' });
  };
  const toggleVis = (id: string) => { setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c))); toast('Updated'); };
  const del = async (id: string) => { if (await tgConfirm('Delete this collection?')) { setCollections((prev) => prev.filter((c) => c.id !== id)); toast('Deleted'); } };

  return (
    <>
      <AdminHeader title="Collections" back="/admin" actions={<button className="appbar__btn" aria-label="New collection" onClick={() => openEdit(null)}><Icon name="plus" size={22} /></button>} />
      <main className="screen">
        <div className="kpi-grid">
          <div className="kpi"><span className="kpi__label"><span className="kpi__icon"><Icon name="grid" size={18} /></span>Collections</span><span className="kpi__value">{collections.length}</span></div>
          <div className="kpi"><span className="kpi__label"><span className="kpi__icon"><Icon name="star" size={18} /></span>Featured</span><span className="kpi__value">{collections.filter((c) => c.featured).length}</span></div>
        </div>
        <div className="container">
          {collections.map((c) => (
            <div key={c.id} className="card card--pad" style={{ marginBottom: 12 }}>
              <div className="row gap-3">
                <span className="data-row__avatar">{c.emoji}</span>
                <div className="grow"><div className="semibold">{c.name}{c.featured && <span className="status status--paid" style={{ marginInlineStart: 6 }}>Featured</span>}</div><div className="muted text-sm">{c.desc} · {c.count} products</div></div>
              </div>
              <div className="row-between" style={{ marginTop: 12 }}>
                <label className="row gap-3" style={{ alignItems: 'center' }}><span className="text-sm">Visible</span><Switch checked={c.visible} onChange={() => toggleVis(c.id)} /></label>
                <div className="row gap-3">
                  <button className="text-accent semibold text-sm" onClick={() => openEdit(c)}>Edit</button>
                  <button className="semibold text-sm" style={{ color: 'var(--danger)' }} onClick={() => del(c.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <AdminTabBar active="products" />

      {editing && (
        <Sheet title={editing.id ? 'Edit collection' : 'New collection'} onClose={() => setEditing(null)}>
          <div className="form-grid">
            <div className="field"><label className="field__label" htmlFor="coll-emoji">Emoji</label><input id="coll-emoji" className="input" value={form.emoji} onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))} maxLength={2} /></div>
            <div className="field"><label className="field__label" htmlFor="coll-count">Products</label><input id="coll-count" className="input" type="number" min={0} value={form.count} onChange={(e) => setForm((f) => ({ ...f, count: e.target.value }))} /></div>
          </div>
          <div className="field"><label className="field__label" htmlFor="coll-name">Name</label><input id="coll-name" className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Summer Essentials" /></div>
          <div className="field"><label className="field__label" htmlFor="coll-desc">Description</label><input id="coll-desc" className="input" value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} /></div>
          <label className="row-between" style={{ padding: '12px 0' }}><span>Feature on storefront</span><Switch checked={form.featured} onChange={(v) => setForm((f) => ({ ...f, featured: v }))} /></label>
          <button className="btn btn--block" onClick={submit}>{editing.id ? 'Save collection' : 'Create collection'}</button>
        </Sheet>
      )}
    </>
  );
}
