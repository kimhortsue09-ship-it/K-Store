'use client';
/**
 * Admin marketing — promo / discount codes. Ports admin/marketing.js: codes are seeded from
 * config.commerce.promoCodes, each has an enable/disable switch, and the header "+" opens a
 * "New discount" sheet that validates and appends a code. In-memory demo state.
 */
import { useState } from 'react';
import { config } from '@/config';
import { formatPrice } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { Switch } from '@/components/Switch';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabBar } from '@/components/admin/AdminTabBar';

type PromoType = 'percentage' | 'fixed';
interface PromoCode { code: string; label: string; type: PromoType; value: number; enabled: boolean }

const valueLabel = (c: PromoCode) => (c.type === 'percentage' ? `${c.value}% off` : `${formatPrice(c.value)} off`);

export default function AdminMarketingPage() {
  const [codes, setCodes] = useState<PromoCode[]>(() =>
    Object.entries(config.commerce.promoCodes).map(([code, v]) => ({ code, ...v, enabled: true })),
  );
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState<PromoType>('percentage');
  const [value, setValue] = useState('');

  const openCreate = () => { setCode(''); setLabel(''); setType('percentage'); setValue(''); setCreating(true); haptic('selection'); };

  const toggle = (target: string, enabled: boolean) => {
    setCodes((prev) => prev.map((c) => (c.code === target ? { ...c, enabled } : c)));
    toast(`${target} ${enabled ? 'enabled' : 'disabled'}`);
  };

  const save = () => {
    const trimmed = code.trim();
    if (!trimmed || !value.trim()) { toast('Code and value are required', { kind: 'danger' }); haptic('error'); return; }
    const entry: PromoCode = { code: trimmed.toUpperCase(), label: label.trim() || 'New discount', type, value: parseFloat(value) || 0, enabled: true };
    setCodes((prev) => [...prev, entry]);
    haptic('success');
    setCreating(false);
    toast('Discount created (demo)', { kind: 'success' });
  };

  return (
    <>
      <AdminHeader
        title="Marketing"
        back="/admin"
        actions={<button className="appbar__btn" aria-label="New discount" onClick={openCreate}><Icon name="plus" size={22} /></button>}
      />
      <main className="screen">
        <div className="admin-section-title">Discount codes ({codes.length})</div>
        <div className="stack">
          {codes.map((c) => (
            <div key={c.code} className="card card--pad promo-card">
              <div className="row-between">
                <div className="row gap-2">
                  <span className="kpi__icon"><Icon name="tag" size={18} /></span>
                  <div>
                    <div className="semibold">{c.code}</div>
                    <div className="muted text-sm">{c.label}</div>
                  </div>
                </div>
                <Switch checked={c.enabled} onChange={(v) => toggle(c.code, v)} />
              </div>
              <div className="row-between" style={{ marginTop: 12 }}>
                <span className="status status--paid">{valueLabel(c)}</span>
                <span className="muted text-sm">{c.type}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
      <AdminTabBar active="dashboard" />

      {creating && (
        <Sheet title="New discount" onClose={() => setCreating(false)}>
          <div className="field"><label className="field__label" htmlFor="mkt-code">Code</label><input id="mkt-code" className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="SUMMER25" autoComplete="off" /></div>
          <div className="field"><label className="field__label" htmlFor="mkt-label">Label</label><input id="mkt-label" className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="25% summer sale" /></div>
          <div className="field"><label className="field__label" htmlFor="mkt-type">Type</label>
            <select id="mkt-type" className="select" value={type} onChange={(e) => setType(e.target.value as PromoType)}>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </div>
          <div className="field"><label className="field__label" htmlFor="mkt-value">Value</label><input id="mkt-value" className="input" type="number" min="0" step="1" value={value} onChange={(e) => setValue(e.target.value)} placeholder="25" /></div>
          <button className="btn btn--block" onClick={save}>Create discount</button>
        </Sheet>
      )}
    </>
  );
}
