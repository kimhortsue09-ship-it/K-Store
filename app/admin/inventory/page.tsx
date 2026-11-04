'use client';
/**
 * Admin inventory — stock levels at a glance with low-stock highlighting; adjust stock via a
 * bottom sheet. Mirrors admin/inventory.js: rows are buttons that open an "Adjust stock" sheet
 * with +/- steppers and a set-value input; saving clamps to >= 0, updates in-memory state,
 * toasts and re-renders. In-memory demo.
 */
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { productArt } from '@/lib/productArt';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabBar } from '@/components/admin/AdminTabBar';

const LOW = 15;

interface StockItem {
  id: string;
  name: string;
  categoryId: string;
  emoji: string;
  color: string;
  stock: number;
  inStock: boolean;
}

const stepBtn = { border: '1px solid var(--border)', borderRadius: 8, width: 40, height: 40, display: 'grid', placeItems: 'center' } as const;

function statusFor(p: StockItem): { cls: string; label: string } {
  if (!p.inStock) return { cls: 'cancelled', label: 'Out of stock' };
  if (p.stock <= LOW) return { cls: 'pending', label: `${p.stock} units` };
  return { cls: 'delivered', label: `${p.stock} units` };
}

export default function AdminInventoryPage() {
  const { products } = useStore();
  const [items, setItems] = useState<StockItem[]>(() =>
    products.map((p) => ({
      id: p.id,
      name: p.name,
      categoryId: p.categoryId,
      emoji: p.emoji,
      color: p.color,
      stock: p.stock,
      inStock: p.inStock,
    })),
  );
  const [active, setActive] = useState<StockItem | null>(null);
  const [value, setValue] = useState('');

  const low = items.filter((p) => p.inStock && p.stock <= LOW).length;

  const open = (p: StockItem) => { setActive(p); setValue(String(p.stock)); haptic('selection'); };
  const step = (d: number) => setValue((v) => String(Math.max(0, (parseInt(v || '0', 10) || 0) + d)));

  const save = () => {
    if (!active) return;
    const val = parseInt(value || '0', 10);
    if (Number.isNaN(val) || val < 0) { toast('Enter a valid stock level', { kind: 'danger' }); haptic('error'); return; }
    const stock = Math.max(0, val);
    setItems((prev) => prev.map((p) => (p.id === active.id ? { ...p, stock, inStock: stock > 0 } : p)));
    haptic('success');
    toast('Stock updated (demo)', { kind: 'success' });
    setActive(null);
  };

  return (
    <>
      <AdminHeader title="Inventory" back="/admin" />
      <main className="screen">
        {low > 0 && (
          <div className="card card--pad row gap-2" style={{ color: 'var(--warning)' }}>
            <Icon name="bell" size={18} /> {low} product{low > 1 ? 's' : ''} running low on stock
          </div>
        )}
        <div className="admin-section-title">{items.length} products</div>
        <div className="list" style={{ marginTop: 0 }}>
          {items.map((p) => {
            const { cls, label } = statusFor(p);
            return (
              <button key={p.id} className="data-row" onClick={() => open(p)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="data-row__avatar" src={productArt(p)} alt="" width={40} height={40} />
                <span className="data-row__main">
                  <span className="data-row__title">{p.name}</span>
                  <span className="data-row__sub">{p.categoryId}</span>
                </span>
                <span className={`status status--${cls}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </main>
      <AdminTabBar active="products" />

      {active && (
        <Sheet title="Adjust stock" onClose={() => setActive(null)}>
          <div className="row gap-3" style={{ marginBottom: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={productArt(active)} width={48} height={48} style={{ borderRadius: 12 }} alt="" />
            <div>
              <div className="semibold">{active.name}</div>
              <div className="muted text-sm">Current: {active.stock} units</div>
            </div>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="inv-stock">New stock level</label>
            <div className="row gap-2">
              <button type="button" aria-label="Decrease" onClick={() => step(-1)} style={stepBtn}><Icon name="minus" size={18} /></button>
              <input id="inv-stock" className="input" type="number" min={0} step={1} value={value} onChange={(e) => setValue(e.target.value)} style={{ textAlign: 'center' }} />
              <button type="button" aria-label="Increase" onClick={() => step(1)} style={stepBtn}><Icon name="plus" size={18} /></button>
            </div>
          </div>
          <button className="btn btn--block" onClick={save}>Update stock</button>
        </Sheet>
      )}
    </>
  );
}
