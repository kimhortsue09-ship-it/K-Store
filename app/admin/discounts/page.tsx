'use client';
/**
 * Admin discounts — automatic & scheduled discount rules (percentage, fixed, BOGO, tiered).
 * Mirrors admin/discounts.js: filter tabs, KPI row, per-rule active toggle, edit/create in a
 * bottom sheet, and delete with confirm. In-memory demo state.
 */
import { useState } from 'react';
import { formatPrice } from '@/lib/format';
import { haptic, tgConfirm } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { Switch } from '@/components/Switch';
import { Sheet } from '@/components/Sheet';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabBar } from '@/components/admin/AdminTabBar';

type DiscountType = 'percentage' | 'fixed' | 'bogo' | 'tiered';
const TYPES: Record<DiscountType, string> = {
  percentage: 'Percentage off',
  fixed: 'Fixed amount off',
  bogo: 'Buy one get one',
  tiered: 'Spend & save',
};

interface Rule {
  id: string;
  name: string;
  type: DiscountType;
  value: number;
  applies: string;
  active: boolean;
  redeemed: number;
  saved: number;
}

const SEED: Rule[] = [
  { id: 'd1', name: 'Summer 20% off electronics', type: 'percentage', value: 20, applies: 'Electronics', active: true, redeemed: 142, saved: 1980 },
  { id: 'd2', name: 'Spend $150, save $20', type: 'tiered', value: 20, applies: 'All products', active: true, redeemed: 63, saved: 1260 },
  { id: 'd3', name: 'BOGO on e-books', type: 'bogo', value: 100, applies: 'E-books', active: false, redeemed: 0, saved: 0 },
];

const FILTERS: ['all' | 'active' | 'inactive', string][] = [
  ['all', 'All'], ['active', 'Active'], ['inactive', 'Inactive'],
];

interface Draft { name: string; type: DiscountType; value: string; applies: string }

export default function AdminDiscountsPage() {
  const [rules, setRules] = useState<Rule[]>(SEED);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [editing, setEditing] = useState<Rule | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>({ name: '', type: 'percentage', value: '', applies: 'All products' });

  const list = rules.filter((d) => filter === 'all' || (filter === 'active' ? d.active : !d.active));
  const activeCount = rules.filter((d) => d.active).length;
  const totalSaved = rules.reduce((s, d) => s + d.saved, 0);

  const toggle = (id: string) => {
    setRules((prev) => prev.map((d) => (d.id === id ? { ...d, active: !d.active } : d)));
    haptic('selection');
    toast('Updated');
  };

  const openCreate = () => {
    setEditing(null);
    setDraft({ name: '', type: 'percentage', value: '', applies: 'All products' });
    setCreating(true);
  };
  const openEdit = (d: Rule) => {
    setEditing(d);
    setDraft({ name: d.name, type: d.type, value: String(d.value), applies: d.applies });
    setCreating(true);
    haptic('selection');
  };

  const save = () => {
    const name = draft.name.trim();
    if (!name) { toast('Name is required', { kind: 'danger' }); haptic('error'); return; }
    const value = Number(draft.value) || 0;
    const applies = draft.applies.trim() || 'All products';
    if (editing) {
      setRules((prev) => prev.map((d) => (d.id === editing.id ? { ...d, name, type: draft.type, value, applies } : d)));
    } else {
      setRules((prev) => [{ id: 'd' + Date.now().toString(36), name, type: draft.type, value, applies, active: true, redeemed: 0, saved: 0 }, ...prev]);
    }
    haptic('success');
    setCreating(false);
    toast('Discount saved', { kind: 'success' });
  };

  const del = async (id: string) => {
    if (await tgConfirm('Delete this discount?')) {
      setRules((prev) => prev.filter((d) => d.id !== id));
      haptic('success');
      toast('Deleted');
    }
  };

  return (
    <>
      <AdminHeader title="Discounts" back="/admin" actions={<button className="appbar__btn" aria-label="New discount" onClick={openCreate}><Icon name="plus" size={22} /></button>} />
      <main className="screen">
        <div className="kpi-grid">
          <div className="kpi"><span className="kpi__label"><span className="kpi__icon"><Icon name="tag" size={18} /></span>Active rules</span><span className="kpi__value">{activeCount}</span></div>
          <div className="kpi"><span className="kpi__label"><span className="kpi__icon"><Icon name="card" size={18} /></span>Customer savings</span><span className="kpi__value">{formatPrice(totalSaved)}</span></div>
        </div>
        <div className="tabs-pill">{FILTERS.map(([k, l]) => <button key={k} className={`chip${k === filter ? ' is-active' : ''}`} onClick={() => setFilter(k)}>{l}</button>)}</div>
        <div className="container" style={{ paddingTop: 0 }}>
          {list.length ? list.map((d) => (
            <div key={d.id} className="card card--pad" style={{ marginBottom: 12 }}>
              <div className="row-between">
                <div className="grow"><div className="semibold">{d.name}</div><div className="muted text-sm">{TYPES[d.type]} · {d.applies}</div></div>
                <Switch checked={d.active} onChange={() => toggle(d.id)} />
              </div>
              <div className="row-between" style={{ marginTop: 12 }}>
                <span className={`status status--${d.active ? 'paid' : 'cancelled'}`}>{d.type === 'percentage' || d.type === 'bogo' ? `${d.value}%` : formatPrice(d.value)}</span>
                <span className="muted text-sm">{d.redeemed} used · {formatPrice(d.saved)} saved</span>
              </div>
              <div className="row gap-3" style={{ marginTop: 12 }}>
                <button className="text-accent semibold text-sm" onClick={() => openEdit(d)}>Edit</button>
                <button className="semibold text-sm" style={{ color: 'var(--danger)' }} onClick={() => del(d.id)}>Delete</button>
              </div>
            </div>
          )) : <p className="muted text-sm">No discounts.</p>}
        </div>
      </main>
      <AdminTabBar active="dashboard" />

      {creating && (
        <Sheet title={editing ? 'Edit discount' : 'New discount'} onClose={() => setCreating(false)}>
          <div className="field"><label className="field__label" htmlFor="disc-name">Name</label><input id="disc-name" className="input" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. Weekend flash sale" /></div>
          <div className="field"><label className="field__label" htmlFor="disc-type">Type</label>
            <select id="disc-type" className="select" value={draft.type} onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as DiscountType }))}>
              {(Object.entries(TYPES) as [DiscountType, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="form-grid">
            <div className="field"><label className="field__label" htmlFor="disc-value">Value</label><input id="disc-value" className="input" type="number" min="0" value={draft.value} onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))} /></div>
            <div className="field"><label className="field__label" htmlFor="disc-applies">Applies to</label><input id="disc-applies" className="input" value={draft.applies} onChange={(e) => setDraft((d) => ({ ...d, applies: e.target.value }))} /></div>
          </div>
          <button className="btn btn--block" onClick={save}>{editing ? 'Save discount' : 'Create discount'}</button>
        </Sheet>
      )}
    </>
  );
}
