'use client';
/**
 * Admin loyalty program — settings, tiers, top members.
 * Mirrors admin/loyalty.js: KPI grid, program toggle, earning & redemption inputs,
 * editable tier rows (tap → sheet), and top members. Save toasts + haptic. admin.css.
 */
import { useState } from 'react';
import Link from 'next/link';
import { config } from '@/config';
import { LOYALTY_TIERS, tierFor, topMembers, type LoyaltyTier } from '@/lib/admin';
import { usePersistentState } from '@/lib/usePersistentState';
import { formatPrice, formatNumber } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { Switch } from '@/components/Switch';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabBar } from '@/components/admin/AdminTabBar';

const NS = config.data.persistNamespace;
interface Cfg { enabled: boolean; earnRate: number; redeemValue: number; welcomeBonus: number }
const DEFAULTS: Cfg = { enabled: true, earnRate: 1, redeemValue: 5, welcomeBonus: 100 };

type Tier = LoyaltyTier;

/** Top members are the real customers, ranked by points — tapping one opens their detail sheet. */
const TOP = topMembers();
const initials = (name: string) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export default function AdminLoyaltyPage() {
  const [cfg, setCfg] = usePersistentState<Cfg>(`${NS}:loyaltyConfig`, DEFAULTS);
  const [tiers, setTiers] = useState<Tier[]>(LOYALTY_TIERS);
  const [editing, setEditing] = useState<Tier | null>(null);
  const [perk, setPerk] = useState('');
  const [min, setMin] = useState('');

  const upd = (k: keyof Cfg, v: number | boolean) => setCfg((c) => ({ ...c, [k]: v }));

  const save = () => { haptic('success'); toast('Loyalty settings saved', { kind: 'success' }); };

  const openTier = (t: Tier) => { setEditing(t); setPerk(t.perk); setMin(String(t.min)); haptic('selection'); };

  const saveTier = () => {
    if (!editing) return;
    if (!perk.trim()) { toast('Enter a perk description', { kind: 'danger' }); haptic('error'); return; }
    const nextMin = Math.max(0, +min || 0);
    setTiers((prev) => prev.map((t) => (t.name === editing.name ? { ...t, perk: perk.trim(), min: nextMin } : t)));
    haptic('success'); toast(`${editing.name} tier updated`, { kind: 'success' });
    setEditing(null);
  };

  return (
    <>
      <AdminHeader title="Loyalty program" back="/admin" />
      <main className="screen">
        <div className="kpi-grid">
          <div className="kpi"><span className="kpi__label"><span className="kpi__icon"><Icon name="users" size={18} /></span>Members</span><span className="kpi__value">1,284</span></div>
          <div className="kpi"><span className="kpi__label"><span className="kpi__icon"><Icon name="star" size={18} /></span>Points outstanding</span><span className="kpi__value">86.4k</span></div>
        </div>

        <div className="container" style={{ paddingBottom: 0 }}>
          <label className="card card--pad row-between" style={{ marginBottom: 12 }}><span className="semibold">Loyalty program</span>
            <Switch checked={cfg.enabled} onChange={(v) => upd('enabled', v)} /></label>
        </div>

        <div className="admin-section-title">Earning &amp; redemption</div>
        <div className="container" style={{ paddingTop: 0 }}>
          <div className="card card--pad">
            <div className="field"><label className="field__label" htmlFor="loy-earn">Points earned per {formatPrice(1)} spent</label><input id="loy-earn" className="input" type="number" min={0} step={0.5} value={cfg.earnRate} onChange={(e) => upd('earnRate', +e.target.value || 0)} /></div>
            <div className="field"><label className="field__label" htmlFor="loy-redeem">Value of 100 points (store credit)</label><input id="loy-redeem" className="input" type="number" min={0} step={0.5} value={cfg.redeemValue} onChange={(e) => upd('redeemValue', +e.target.value || 0)} /></div>
            <div className="field" style={{ marginBottom: 0 }}><label className="field__label" htmlFor="loy-welcome">Sign-up welcome bonus (points)</label><input id="loy-welcome" className="input" type="number" min={0} value={cfg.welcomeBonus} onChange={(e) => upd('welcomeBonus', +e.target.value || 0)} /></div>
          </div>
        </div>

        <div className="admin-section-title">Tiers</div>
        <div className="list" style={{ marginTop: 0, padding: '0 16px' }}>
          {tiers.map((t) => (
            <button key={t.name} className="data-row" onClick={() => openTier(t)}>
              <span className={`data-row__avatar ${t.color}`}>⭐</span>
              <span className="data-row__main"><span className="data-row__title">{t.name}</span><span className="data-row__sub">{t.perk}</span></span>
              <span className="data-row__end"><span className="semibold">{formatNumber(t.min)}+</span><span className="muted text-sm">points</span></span>
            </button>
          ))}
        </div>

        <div className="admin-section-title">Top members</div>
        <div className="list" style={{ marginTop: 0, padding: '0 16px' }}>
          {TOP.map((c) => (
            <Link key={c.id} href={`/admin/customers?id=${c.id}`} className="data-row">
              <span className="data-row__avatar">{initials(c.name)}</span>
              <span className="data-row__main"><span className="data-row__title">{c.name}</span><span className="data-row__sub">{tierFor(c.points).name} member</span></span>
              <span className="data-row__end"><span className="semibold text-accent">{formatNumber(c.points)}</span><span className="muted text-sm">points</span></span>
            </Link>
          ))}
        </div>

        <div className="container"><button className="btn btn--block" onClick={save}><Icon name="check" size={18} /> Save changes</button></div>
        <div style={{ height: 8 }} />
      </main>
      <AdminTabBar active="dashboard" />

      {editing && (
        <Sheet title={`Edit ${editing.name} tier`} onClose={() => setEditing(null)}>
          <div className="field"><label className="field__label" htmlFor="loy-perk">Perk</label><input id="loy-perk" className="input" value={perk} onChange={(e) => setPerk(e.target.value)} placeholder="e.g. 1.5× points + free shipping" /></div>
          <div className="field"><label className="field__label" htmlFor="loy-min">Minimum points to qualify</label><input id="loy-min" className="input" type="number" min={0} value={min} onChange={(e) => setMin(e.target.value)} /></div>
          <button className="btn btn--block" onClick={saveTier}>Save tier</button>
        </Sheet>
      )}
    </>
  );
}
