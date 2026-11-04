'use client';
/**
 * Admin shipping — shipping zones. Mirrors admin/shipping.js: the zones are DERIVED FROM CONFIG
 * (`config.commerce.shippingFlat`), an "add zone" action opens a bottom sheet, and the Rules
 * (free-shipping threshold, tax on shipping) + Save give toast feedback. Each zone row also opens
 * an edit sheet (name/rate/eta) with delete, and carries an active toggle. No tab bar here —
 * admin/shipping.html uses `screen--no-tabbar` + a fixed bottom bar. All in-memory demo state.
 */
import { useState } from 'react';
import { config } from '@/config';
import { formatPrice } from '@/lib/format';
import { haptic, tgConfirm } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Switch } from '@/components/Switch';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { AdminHeader } from '@/components/admin/AdminHeader';

interface Zone { id: string; name: string; rate: number; eta: string; active: boolean }
/** Seeded from config, exactly like shipping.js:16-20 — change the config and the screen follows. */
const SEED: Zone[] = [
  { id: 'z1', name: 'Domestic', rate: config.commerce.shippingFlat, eta: '3–5 days', active: true },
  { id: 'z2', name: 'Express', rate: config.commerce.shippingFlat + 8, eta: '1–2 days', active: true },
  { id: 'z3', name: 'International', rate: 24.99, eta: '7–14 days', active: true },
];

export default function AdminShippingPage() {
  const [zones, setZones] = useState<Zone[]>(SEED);
  const [freeThreshold, setFreeThreshold] = useState(String(config.commerce.freeShippingThreshold));
  const [taxShipping, setTaxShipping] = useState(false);

  // Add-zone sheet
  const [addOpen, setAddOpen] = useState(false);
  const [aName, setAName] = useState('');
  const [aRate, setARate] = useState('');
  const [aEta, setAEta] = useState('');

  // Edit-zone sheet
  const [editing, setEditing] = useState<Zone | null>(null);
  const [eName, setEName] = useState('');
  const [eRate, setERate] = useState('');
  const [eEta, setEEta] = useState('');

  const toggle = (id: string) => {
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, active: !z.active } : z)));
    haptic('selection');
  };

  const openAdd = () => { setAName(''); setARate(''); setAEta(''); setAddOpen(true); haptic('selection'); };

  const addZone = () => {
    const name = aName.trim();
    if (!name) { toast('Zone name is required', { kind: 'danger' }); haptic('error'); return; }
    const rate = parseFloat(aRate || '0') || 0;
    if (rate < 0) { toast('Rate cannot be negative', { kind: 'danger' }); haptic('error'); return; }
    const zone: Zone = { id: 'z' + (Date.now()), name, rate, eta: aEta.trim() || '—', active: true };
    setZones((prev) => [...prev, zone]);
    haptic('success');
    toast('Zone added (demo)', { kind: 'success' });
    setAddOpen(false);
  };

  const openEdit = (z: Zone) => {
    setEditing(z);
    setEName(z.name);
    setERate(String(z.rate));
    setEEta(z.eta);
    haptic('selection');
  };

  const saveEdit = () => {
    if (!editing) return;
    const name = eName.trim();
    if (!name) { toast('Zone name is required', { kind: 'danger' }); haptic('error'); return; }
    const rate = parseFloat(eRate || '0') || 0;
    if (rate < 0) { toast('Rate cannot be negative', { kind: 'danger' }); haptic('error'); return; }
    setZones((prev) => prev.map((z) => (z.id === editing.id ? { ...z, name, rate, eta: eEta.trim() || '—' } : z)));
    haptic('success');
    toast('Zone updated (demo)', { kind: 'success' });
    setEditing(null);
  };

  const deleteZone = async () => {
    if (!editing) return;
    if (!(await tgConfirm(`Delete "${editing.name}"?`))) return;
    setZones((prev) => prev.filter((z) => z.id !== editing.id));
    haptic('success');
    toast('Zone deleted (demo)', { kind: 'success' });
    setEditing(null);
  };

  const save = () => { haptic('success'); toast('Shipping saved (demo)', { kind: 'success' }); };

  return (
    <>
      <AdminHeader
        title="Shipping"
        back="/admin"
        actions={<button className="appbar__btn" onClick={openAdd} aria-label="Add zone"><Icon name="plus" size={22} /></button>}
      />
      <main className="screen screen--no-tabbar">
        <div className="admin-section-title">Shipping zones</div>
        <div className="list" style={{ marginTop: 0, padding: '0 16px 16px' }}>
          {zones.map((z) => (
            <div key={z.id} className="data-row">
              <span className="data-row__avatar"><Icon name="truck" size={18} /></span>
              <button
                className="data-row__main"
                onClick={() => openEdit(z)}
                style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', font: 'inherit', cursor: 'pointer' }}
              >
                <span className="data-row__title">{z.name}</span>
                <span className="data-row__sub">{z.eta}</span>
              </button>
              <span className="data-row__end">
                <span className="semibold">{formatPrice(z.rate)}</span>
                <Switch checked={z.active} onChange={() => toggle(z.id)} />
              </span>
            </div>
          ))}
        </div>

        <div className="admin-section-title">Rules</div>
        <div className="container">
          <div className="field">
            <label className="field__label" htmlFor="ship-free">Free shipping over</label>
            <input id="ship-free" className="input" type="number" min="0" step="1" value={freeThreshold} onChange={(e) => setFreeThreshold(e.target.value)} />
          </div>
          <div className="list-row" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
            <span className="list-row__text"><span className="list-row__title">Charge tax on shipping</span></span>
            <Switch checked={taxShipping} onChange={setTaxShipping} />
          </div>
        </div>
      </main>

      {/* admin/shipping.html has no tab bar — a fixed `#bottombar` carries the save action. */}
      <div className="bottom-bar">
        <button className="btn btn--block" onClick={save}>Save shipping</button>
      </div>

      {addOpen && (
        <Sheet title="New zone" onClose={() => setAddOpen(false)}>
          <div className="field">
            <label className="field__label" htmlFor="ship-add-name">Zone name</label>
            <input id="ship-add-name" className="input" value={aName} onChange={(e) => setAName(e.target.value)} placeholder="Europe" />
          </div>
          <div className="form-grid">
            <div className="field">
              <label className="field__label" htmlFor="ship-add-rate">Rate</label>
              <input id="ship-add-rate" className="input" type="number" min="0" step="0.01" value={aRate} onChange={(e) => setARate(e.target.value)} placeholder="12.00" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="ship-add-eta">ETA</label>
              <input id="ship-add-eta" className="input" value={aEta} onChange={(e) => setAEta(e.target.value)} placeholder="3–6 days" />
            </div>
          </div>
          <button className="btn btn--block" onClick={addZone}>Add zone</button>
        </Sheet>
      )}

      {editing && (
        <Sheet title="Edit zone" onClose={() => setEditing(null)}>
          <div className="field">
            <label className="field__label" htmlFor="ship-edit-name">Zone name</label>
            <input id="ship-edit-name" className="input" value={eName} onChange={(e) => setEName(e.target.value)} placeholder="Europe" />
          </div>
          <div className="form-grid">
            <div className="field">
              <label className="field__label" htmlFor="ship-edit-rate">Rate</label>
              <input id="ship-edit-rate" className="input" type="number" min="0" step="0.01" value={eRate} onChange={(e) => setERate(e.target.value)} placeholder="12.00" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="ship-edit-eta">ETA</label>
              <input id="ship-edit-eta" className="input" value={eEta} onChange={(e) => setEEta(e.target.value)} placeholder="3–6 days" />
            </div>
          </div>
          <button className="btn btn--block" onClick={saveEdit}>Save changes</button>
          <button className="btn btn--block btn--ghost" style={{ marginTop: 8, color: 'var(--danger)' }} onClick={deleteZone}>Delete zone</button>
        </Sheet>
      )}
    </>
  );
}
