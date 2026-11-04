'use client';
/**
 * Admin products — searchable, sortable catalogue with in-memory CRUD.
 * Mirrors admin/products.js: search + sort, CSV export (and an Import bottom sheet with a
 * downloadable template), and rows that link to the full editor at /admin/product-edit.
 * The pencil button on each row opens a quick-edit sheet (name/type/category/price/compare-at/
 * stock/description + emoji/colour + active toggle) for fast tweaks without leaving the list.
 * All demo state via useState.
 */
import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { formatPrice } from '@/lib/format';
import { productArt } from '@/lib/productArt';
import { haptic, tgConfirm } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { Switch } from '@/components/Switch';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabBar } from '@/components/admin/AdminTabBar';
import type { Product, ProductType } from '@/lib/types';

const COLUMNS = ['id', 'name', 'type', 'categoryId', 'price', 'stock', 'inStock'] as const;
const EMOJIS = ['📦', '🎧', '⌚', '📱', '💻', '👕', '🧥', '👜', '👟', '🫖', '🎨', '🎮', '📘', '📚', '💾', '🔑', '☕', '🍿', '💡', '🕶️'];
const COLORS = ['#5B6CFF', '#3AA0FF', '#00A884', '#F5A524', '#FF4757', '#A855F7', '#EC4899', '#8B5CF6'];

type SortKey = 'name' | 'price-desc' | 'price-asc' | 'stock';
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'price-desc', label: 'Price ↓' },
  { key: 'price-asc', label: 'Price ↑' },
  { key: 'stock', label: 'Stock' },
];

interface Draft {
  id: string;
  name: string;
  type: ProductType;
  categoryId: string;
  price: string;
  originalPrice: string;
  stock: string;
  description: string;
  emoji: string;
  color: string;
  inStock: boolean;
}

const csvCell = (v: unknown): string => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

/** Minimal CSV row parser (handles quoted fields + escaped quotes). */
function parseRow(line: string): string[] {
  const out: string[] = []; let cur = ''; let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

export default function AdminProductsPage() {
  const { products: catalog, categories } = useStore();
  const [products, setProducts] = useState<Product[]>(() => catalog.map((p) => ({ ...p })));
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortKey>('name');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [importSheet, setImportSheet] = useState(false);
  const csvInput = useRef<HTMLInputElement>(null);

  const list = useMemo(() => {
    const filtered = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sort === 'price-desc') return b.price - a.price;
      if (sort === 'price-asc') return a.price - b.price;
      if (sort === 'stock') return b.stock - a.stock;
      return a.name.localeCompare(b.name);
    });
    return sorted;
  }, [products, q, sort]);

  /* ---- CSV export / import ------------------------------------------------ */
  const exportCsv = () => {
    const rows = [COLUMNS.join(',')].concat(
      products.map((p) => COLUMNS.map((c) => csvCell((p as unknown as Record<string, unknown>)[c])).join(',')),
    );
    const blob = new Blob([rows.join('\r\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'products.csv';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    haptic('success');
    toast(`Exported ${products.length} products`, { kind: 'success' });
  };

  const ingest = (text: string) => {
    const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim());
    if (lines.length < 2) { toast('No rows found in file', { kind: 'danger' }); haptic('error'); return; }
    const header = parseRow(lines[0]).map((h) => h.trim());
    let added = 0; let updated = 0;
    setProducts((prev) => {
      const next = prev.map((p) => ({ ...p }));
      for (const line of lines.slice(1)) {
        const cells = parseRow(line);
        const rec: Record<string, string> = {};
        header.forEach((h, i) => { rec[h] = (cells[i] ?? '').trim(); });
        if (!rec.name && !rec.id) continue;
        const stock = parseInt(rec.stock, 10) || 0;
        const norm: Product = {
          id: rec.id || `imp-${next.length + added + 1}`,
          name: rec.name || 'Untitled',
          type: rec.type === 'digital' ? 'digital' : 'physical',
          categoryId: rec.categoryId || 'other',
          price: parseFloat(rec.price) || 0,
          stock,
          inStock: /^(true|1|yes)$/i.test(rec.inStock || '') || stock > 0,
          rating: 0, reviewCount: 0, badges: [],
          emoji: '📦', color: '#5B6CFF', description: '',
        };
        const existing = next.find((p) => p.id === norm.id);
        if (existing) { Object.assign(existing, norm); updated++; } else { next.unshift(norm); added++; }
      }
      return next;
    });
    haptic('success');
    toast(`Imported: ${added} added, ${updated} updated`, { kind: 'success' });
  };

  const onCsvFile = (f: File | undefined) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => { setImportSheet(false); ingest(String(reader.result)); };
    reader.readAsText(f);
  };

  /** Emit a one-row starter file so merchants can see the expected column order. */
  const downloadTemplate = () => {
    const sample = [COLUMNS.join(','), 'p-new-1,Sample Product,physical,electronics,49.99,25,true'].join('\r\n');
    const url = URL.createObjectURL(new Blob([sample], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'products-template.csv';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  /* ---- Quick-edit sheet --------------------------------------------------- */
  const toDraft = (p: Product): Draft => ({
    id: p.id, name: p.name, type: p.type, categoryId: p.categoryId,
    price: String(p.price), originalPrice: p.originalPrice != null ? String(p.originalPrice) : '',
    stock: String(p.stock), description: p.description, emoji: p.emoji, color: p.color, inStock: p.inStock,
  });

  const openEdit = (p: Product) => { setDraft(toDraft(p)); haptic('selection'); };

  const patch = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));

  const save = () => {
    if (!draft) return;
    if (!draft.name.trim() || !draft.price.trim()) {
      toast('Name and price are required', { kind: 'danger' }); haptic('error'); return;
    }
    const price = parseFloat(draft.price);
    if (Number.isNaN(price) || price < 0) { toast('Enter a valid price', { kind: 'danger' }); haptic('error'); return; }
    const stock = parseInt(draft.stock || '0', 10) || 0;
    const built: Product = {
      id: draft.id,
      name: draft.name.trim(),
      type: draft.type,
      categoryId: draft.categoryId,
      price,
      originalPrice: draft.originalPrice.trim() ? parseFloat(draft.originalPrice) : undefined,
      stock,
      inStock: draft.inStock && stock > 0 ? true : draft.inStock,
      rating: 0, reviewCount: 0, badges: [],
      emoji: draft.emoji, color: draft.color, description: draft.description.trim(),
    };
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === built.id);
      if (idx === -1) return [built, ...prev];
      // keep the previous rating/reviews/badges when editing
      const keep = prev[idx];
      const merged: Product = { ...built, rating: keep.rating, reviewCount: keep.reviewCount, badges: keep.badges };
      return prev.map((p, i) => (i === idx ? merged : p));
    });
    haptic('success');
    toast('Changes saved', { kind: 'success' });
    setDraft(null);
  };

  const remove = async () => {
    if (!draft) return;
    if (!(await tgConfirm(`Delete "${draft.name || 'this product'}"?`))) return;
    setProducts((prev) => prev.filter((p) => p.id !== draft.id));
    haptic('success');
    toast('Product deleted', { kind: 'danger' });
    setDraft(null);
  };

  return (
    <>
      <AdminHeader
        title="Products"
        back="/admin"
        actions={<Link className="appbar__btn" href="/admin/product-edit" aria-label="Add product"><Icon name="plus" size={22} /></Link>}
      />
      <main className="screen">
        <div className="searchbar">
          <div className="searchbar__field">
            <Icon name="search" size={20} />
            <input aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" autoComplete="off" />
          </div>
        </div>

        <div className="tabs-pill" style={{ paddingTop: 0 }}>
          <button className="chip" onClick={exportCsv}><Icon name="download" size={16} /> Export CSV</button>
          <button className="chip" onClick={() => { setImportSheet(true); haptic('selection'); }}><Icon name="upload" size={16} /> Import CSV</button>
          {SORTS.map((s) => (
            <button
              key={s.key}
              className={`chip${sort === s.key ? ' is-active' : ''}`}
              onClick={() => { setSort(s.key); haptic('selection'); }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="admin-section-title">{list.length} products</div>
        <div className="list" style={{ margin: 0, padding: '0 16px 16px' }}>
          {list.length === 0 ? (
            <div className="empty-state"><h3>No matches</h3></div>
          ) : list.map((p) => {
            const stockKey = !p.inStock ? 'cancelled' : p.stock <= 15 ? 'pending' : 'delivered';
            return (
              <div key={p.id} className="row gap-2">
                {/* The row opens the full editor (images, digital delivery…) — same as the HTML kit. */}
                <Link className="data-row grow" href={`/admin/product-edit?id=${encodeURIComponent(p.id)}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="data-row__avatar" src={productArt(p)} alt="" width={40} height={40} />
                  <span className="data-row__main">
                    <span className="data-row__title">{p.name}</span>
                    <span className="data-row__sub" style={{ textTransform: 'capitalize' }}>{p.type} · {p.categoryId}</span>
                  </span>
                  <span className="data-row__end">
                    <span className="semibold">{formatPrice(p.price)}</span>
                    <span className={`status status--${stockKey}`}>{p.inStock ? `${p.stock} in stock` : 'Out'}</span>
                  </span>
                </Link>
                {/* Quick edit — tweak price/stock/status without leaving the list. */}
                <button className="btn btn--sm btn--ghost" aria-label={`Quick edit ${p.name}`} onClick={() => openEdit(p)}>
                  <Icon name="edit" size={18} />
                </button>
              </div>
            );
          })}
        </div>
      </main>
      <AdminTabBar active="products" />

      {importSheet && (
        <Sheet title="Import products" onClose={() => setImportSheet(false)}>
          <div className="stack gap-3">
            <p className="muted text-sm">
              Upload a CSV with columns: <strong>{COLUMNS.join(', ')}</strong>. Rows matching an existing id are updated; others are added.
            </p>
            <input
              ref={csvInput}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={(e) => { onCsvFile(e.target.files?.[0]); e.target.value = ''; }}
            />
            <button className="btn btn--block" onClick={() => csvInput.current?.click()}>
              <Icon name="upload" size={18} /> Choose CSV file
            </button>
            <button className="btn btn--outline btn--block" onClick={downloadTemplate}>
              <Icon name="download" size={18} /> Download template
            </button>
          </div>
        </Sheet>
      )}

      {draft && (
        <Sheet title="Edit product" onClose={() => setDraft(null)}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={productArt(draft)} alt="" width={72} height={72} style={{ borderRadius: 12 }} />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="prod-name">Product name</label>
            <input id="prod-name" className="input" value={draft.name} onChange={(e) => patch({ name: e.target.value })} placeholder="e.g. Aurora Earbuds" />
          </div>

          <div className="field">
            <label className="field__label">Type</label>
            <div className="segmented">
              <button type="button" className={draft.type !== 'digital' ? 'is-active' : ''} onClick={() => patch({ type: 'physical' })}>Physical</button>
              <button type="button" className={draft.type === 'digital' ? 'is-active' : ''} onClick={() => patch({ type: 'digital' })}>Digital</button>
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="prod-category">Category</label>
            <select id="prod-category" className="select" value={draft.categoryId} onChange={(e) => patch({ categoryId: e.target.value })}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="form-grid">
            <div className="field">
              <label className="field__label" htmlFor="prod-price">Price</label>
              <input id="prod-price" className="input" type="number" min="0" step="0.01" value={draft.price} onChange={(e) => patch({ price: e.target.value })} />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="prod-compare">Compare-at</label>
              <input id="prod-compare" className="input" type="number" min="0" step="0.01" value={draft.originalPrice} onChange={(e) => patch({ originalPrice: e.target.value })} />
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="prod-stock">Stock</label>
            <input id="prod-stock" className="input" type="number" min="0" step="1" value={draft.stock} onChange={(e) => patch({ stock: e.target.value })} />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="prod-desc">Description</label>
            <textarea id="prod-desc" className="textarea" value={draft.description} onChange={(e) => patch({ description: e.target.value })} />
          </div>

          <div className="field">
            <label className="field__label">Icon</label>
            <div className="emoji-picker">
              {EMOJIS.map((e) => (
                <button key={e} type="button" className={e === draft.emoji ? 'on' : ''} onClick={() => patch({ emoji: e })}>{e}</button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="field__label">Background</label>
            <div className="swatches">
              {COLORS.map((c) => (
                <span key={c} role="button" tabIndex={0} aria-label={`Background ${c}`} className={`swatch${c === draft.color ? ' on' : ''}`} style={{ background: c }} onClick={() => patch({ color: c })} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); patch({ color: c }); } }} />
              ))}
            </div>
          </div>

          <div className="row-between" style={{ marginBottom: 16 }}>
            <div><div className="semibold">Active</div><div className="muted text-sm">Visible & purchasable in the store</div></div>
            <Switch checked={draft.inStock} onChange={(v) => patch({ inStock: v })} />
          </div>

          <div className="bottom-bar" style={{ position: 'static', padding: 0, gap: 8 }}>
            <button className="btn btn--outline" onClick={remove} aria-label="Delete product"><Icon name="trash" size={18} /></button>
            <button className="btn grow" onClick={save}>Save changes</button>
          </div>
        </Sheet>
      )}
    </>
  );
}
