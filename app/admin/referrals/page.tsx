'use client';
/**
 * Admin referrals — mirrors admin/referrals.js: program KPIs, an on/off switch + reward
 * config form (referrer reward, friend reward, minimum spend) with a Save action, and a
 * top-referrers list whose rows open a detail sheet (copy invite link, pay pending reward).
 * All mutations are in-memory demo state with haptic + toast feedback.
 */
import { useState } from 'react';
import { formatPrice } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { Switch } from '@/components/Switch';
import { AdminHeader } from '@/components/admin/AdminHeader';

interface Referrer { id: string; name: string; handle: string; invited: number; joined: number; earned: number; paid: boolean }
interface Program { enabled: boolean; referrerReward: number; refereeReward: number; minSpend: number }

const SEED_REFERRERS: Referrer[] = [
  { id: 'r1', name: 'Noor Haddad', handle: '@noorh', invited: 14, joined: 11, earned: 140, paid: false },
  { id: 'r2', name: 'Amara Okafor', handle: '@amara', invited: 9, joined: 7, earned: 90, paid: true },
  { id: 'r3', name: 'Sofia Marín', handle: '@sofiam', invited: 6, joined: 4, earned: 60, paid: false },
  { id: 'r4', name: 'Liam Brooks', handle: '@liamb', invited: 3, joined: 1, earned: 30, paid: false },
];

const initials = (n: string) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export default function AdminReferralsPage() {
  const [program, setProgram] = useState<Program>({ enabled: true, referrerReward: 10, refereeReward: 10, minSpend: 25 });
  const [referrers, setReferrers] = useState<Referrer[]>(SEED_REFERRERS);
  const [refInput, setRefInput] = useState(String(program.referrerReward));
  const [newInput, setNewInput] = useState(String(program.refereeReward));
  const [minInput, setMinInput] = useState(String(program.minSpend));
  const [active, setActive] = useState<Referrer | null>(null);

  const totalInvited = referrers.reduce((s, r) => s + r.invited, 0);
  const totalJoined = referrers.reduce((s, r) => s + r.joined, 0);
  const paid = referrers.reduce((s, r) => s + r.earned, 0);
  const conversion = totalInvited ? Math.round((totalJoined / totalInvited) * 100) : 0;

  const toggleProgram = (enabled: boolean) => {
    setProgram((p) => ({ ...p, enabled }));
    toast(`Program ${enabled ? 'activated' : 'paused'}`);
  };

  const save = () => {
    const referrer = Number(refInput);
    const referee = Number(newInput);
    const minSpend = Number(minInput);
    if ([referrer, referee, minSpend].some((n) => !Number.isFinite(n) || n < 0)) {
      toast('Enter valid, non-negative amounts', { kind: 'danger' });
      haptic('error');
      return;
    }
    setProgram((p) => ({ ...p, referrerReward: referrer, refereeReward: referee, minSpend }));
    haptic('success');
    toast('Referral program saved (demo)', { kind: 'success' });
  };

  const openReferrer = (r: Referrer) => { setActive(r); haptic('selection'); };

  const copyLink = (r: Referrer) => {
    const link = `https://novastore.example/invite/${r.handle.replace(/^@/, '')}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(link).catch(() => undefined);
    }
    haptic('success');
    toast('Referral link copied', { kind: 'success' });
  };

  const payReward = (r: Referrer) => {
    setReferrers((prev) => prev.map((x) => (x.id === r.id ? { ...x, paid: true } : x)));
    setActive((cur) => (cur && cur.id === r.id ? { ...cur, paid: true } : cur));
    haptic('success');
    toast(`Paid ${formatPrice(r.earned)} to ${r.name}`, { kind: 'success' });
  };

  return (
    <>
      <AdminHeader title="Referrals" back="/admin" />
      <main className="screen">
        <div className="kpi-grid">
          <div className="kpi"><span className="kpi__label"><span className="kpi__icon"><Icon name="gift" size={18} /></span>Invites sent</span><span className="kpi__value">{totalInvited}</span></div>
          <div className="kpi"><span className="kpi__label"><span className="kpi__icon"><Icon name="users" size={18} /></span>Joined</span><span className="kpi__value">{totalJoined}</span></div>
          <div className="kpi"><span className="kpi__label"><span className="kpi__icon"><Icon name="check" size={18} /></span>Conversion</span><span className="kpi__value">{conversion}%</span></div>
          <div className="kpi"><span className="kpi__label"><span className="kpi__icon"><Icon name="card" size={18} /></span>Rewards paid</span><span className="kpi__value">{formatPrice(paid)}</span></div>
        </div>

        <div className="admin-section-title">Program</div>
        <div className="list">
          <div className="list-row">
            <span className="list-row__text">
              <span className="list-row__title">Referral program</span>
              <span className="list-row__sub">{program.enabled ? 'Active' : 'Paused'}</span>
            </span>
            <Switch checked={program.enabled} onChange={toggleProgram} />
          </div>
        </div>
        <div className="container">
          <div className="form-grid">
            <div className="field"><label className="field__label" htmlFor="ref-referrer">Referrer reward</label><input id="ref-referrer" className="input" type="number" min="0" step="1" value={refInput} onChange={(e) => setRefInput(e.target.value)} /></div>
            <div className="field"><label className="field__label" htmlFor="ref-friend">Friend reward</label><input id="ref-friend" className="input" type="number" min="0" step="1" value={newInput} onChange={(e) => setNewInput(e.target.value)} /></div>
          </div>
          <div className="field"><label className="field__label" htmlFor="ref-min">Minimum first-order spend</label><input id="ref-min" className="input" type="number" min="0" step="1" value={minInput} onChange={(e) => setMinInput(e.target.value)} /></div>
        </div>

        <div className="admin-section-title">Top referrers</div>
        <div className="list" style={{ marginTop: 0, padding: '0 16px 16px' }}>
          {referrers.map((r) => (
            <button key={r.id} className="data-row" onClick={() => openReferrer(r)}>
              <span className="data-row__avatar">{initials(r.name)}</span>
              <span className="data-row__main">
                <span className="data-row__title">{r.name}</span>
                <span className="data-row__sub">{r.invited} invited · {r.joined} joined</span>
              </span>
              <span className="data-row__end"><span className="semibold" style={{ color: 'var(--accent)' }}>{formatPrice(r.earned)}</span></span>
            </button>
          ))}
        </div>
      </main>
      {/* HTML referrals has no tab bar — a fixed bottom-bar carries the save action. */}
      <div className="bottom-bar"><button className="btn btn--block" onClick={save}>Save program</button></div>

      {active && (
        <Sheet title="Referrer" onClose={() => setActive(null)}>
          <div className="row-between" style={{ marginBottom: 16 }}>
            <div><div className="semibold">{active.name}</div><div className="muted text-sm">{active.handle}</div></div>
            <div style={{ textAlign: 'right' }}><div className="muted text-sm">Earned</div><div className="semibold" style={{ fontSize: 20 }}>{formatPrice(active.earned)}</div></div>
          </div>
          <div className="summary" style={{ padding: 0, marginBottom: 16 }}>
            <div className="summary__row"><span>Friends invited</span><span>{active.invited}</span></div>
            <div className="summary__row"><span>Joined</span><span>{active.joined}</span></div>
            <div className="summary__row"><span>Reward status</span><span style={{ color: active.paid ? 'var(--success)' : 'var(--text-muted)' }}>{active.paid ? 'Paid' : 'Pending'}</span></div>
          </div>
          <button className="btn btn--block btn--outline" style={{ marginBottom: 10 }} onClick={() => copyLink(active)}>Copy referral link</button>
          <button className="btn btn--block" disabled={active.paid} onClick={() => payReward(active)}>{active.paid ? 'Reward paid' : `Pay ${formatPrice(active.earned)} reward`}</button>
        </Sheet>
      )}
    </>
  );
}
