'use client';
/**
 * Admin categories — mirrors admin/categories.js: list categories with their subcategory
 * counts, add a new category via a bottom sheet. Rows are tappable (chevron affordance) to
 * open an "Edit category" sheet where you can rename / re-type or delete. In-memory demo.
 */
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { haptic, tgConfirm } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabBar } from '@/components/admin/AdminTabBar';
import type { ProductType } from '@/lib/types';

interface Cat {
  id: string;
  name: string;
  icon: string;
  type: ProductType;
  subcategories: { name: string; count: number }[];
}

export default function AdminCategoriesPage() {
  const { categories } = useStore();
  const [cats, setCats] = useState<Cat[]>(() =>
    categories.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      type: c.type,
      subcategories: c.subcategories ?? [],
    })),
  );

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Cat | null>(null);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📦');
  const [type, setType] = useState<ProductType>('physical');

  const openAdd = () => {
    setName('');
    setEmoji('📦');
    setType('physical');
    setAdding(true);
    haptic('selection');
  };

  const saveAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast('Name is required', { kind: 'danger' });
      haptic('error');
      return;
    }
    setCats((prev) => [
      ...prev,
      { id: trimmed.toLowerCase().replace(/\s+/g, '-'), name: trimmed, icon: emoji || '📦', type, subcategories: [] },
    ]);
    haptic('success');
    setAdding(false);
    toast('Category added (demo)', { kind: 'success' });
  };

  const openEdit = (c: Cat) => {
    setEditing(c);
    setName(c.name);
    setEmoji(c.icon);
    setType(c.type);
    haptic('selection');
  };

  const saveEdit = () => {
    if (!editing) return;
    const trimmed = name.trim();
    if (!trimmed) {
      toast('Name is required', { kind: 'danger' });
      haptic('error');
      return;
    }
    setCats((prev) => prev.map((c) => (c.id === editing.id ? { ...c, name: trimmed, icon: emoji || '📦', type } : c)));
    haptic('success');
    setEditing(null);
    toast('Category saved (demo)', { kind: 'success' });
  };

  const removeEdit = async () => {
    if (!editing) return;
    if (!(await tgConfirm(`Delete "${editing.name}"?`))) return;
    setCats((prev) => prev.filter((c) => c.id !== editing.id));
    haptic('success');
    setEditing(null);
    toast('Category deleted (demo)', { kind: 'success' });
  };

  return (
    <>
      <AdminHeader
        title="Categories"
        back="/admin"
        actions={
          <button className="appbar__btn" aria-label="Add category" onClick={openAdd}>
            <Icon name="plus" size={22} />
          </button>
        }
      />
      <main className="screen">
        <div className="admin-section-title">{cats.length} categories</div>
        <div className="list" style={{ marginTop: 0 }}>
          {cats.map((c) => {
            const subCount = c.subcategories.reduce((n, s) => n + (s.count || 0), 0);
            return (
              <button key={c.id} className="data-row" onClick={() => openEdit(c)}>
                <span className="data-row__avatar">{c.icon || '📦'}</span>
                <span className="data-row__main">
                  <span className="data-row__title">{c.name}</span>
                  <span className="data-row__sub">
                    {c.type} · {c.subcategories.length} subcategories · {subCount} items
                  </span>
                </span>
                <Icon name="chevron" size={18} className="text-faint" />
              </button>
            );
          })}
        </div>
      </main>
      <AdminTabBar active="products" />

      {adding && (
        <Sheet title="New category" onClose={() => setAdding(false)}>
          <div className="field">
            <label className="field__label" htmlFor="cat-add-name">Name</label>
            <input id="cat-add-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Accessories" />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="cat-add-emoji">Emoji</label>
            <input id="cat-add-emoji" className="input" value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="🎒" />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="cat-add-type">Type</label>
            <select id="cat-add-type" className="select" value={type} onChange={(e) => setType(e.target.value as ProductType)}>
              <option value="physical">Physical</option>
              <option value="digital">Digital</option>
            </select>
          </div>
          <button className="btn btn--block" onClick={saveAdd}>Add category</button>
        </Sheet>
      )}

      {editing && (
        <Sheet title="Edit category" onClose={() => setEditing(null)}>
          <div className="field">
            <label className="field__label" htmlFor="cat-edit-name">Name</label>
            <input id="cat-edit-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Accessories" />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="cat-edit-emoji">Emoji</label>
            <input id="cat-edit-emoji" className="input" value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="🎒" />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="cat-edit-type">Type</label>
            <select id="cat-edit-type" className="select" value={type} onChange={(e) => setType(e.target.value as ProductType)}>
              <option value="physical">Physical</option>
              <option value="digital">Digital</option>
            </select>
          </div>
          <button className="btn btn--block" onClick={saveEdit}>Save changes</button>
          <button className="btn btn--block btn--ghost" style={{ marginTop: 8, color: 'var(--danger)' }} onClick={removeEdit}>
            <Icon name="trash" size={18} /> Delete category
          </button>
        </Sheet>
      )}
    </>
  );
}
