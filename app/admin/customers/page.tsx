'use client';
/**
 * Admin customers — searchable list with lifetime spend + order counts.
 * Mirrors admin/customers.js: rows are buttons that open a "Customer" profile sheet with
 * account details (incl. loyalty tier + staff role) and lifetime KPIs, plus Ban / Unban
 * controls. `?id=` deep-links straight into a customer's sheet (the loyalty screen links here).
 */
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DEMO_CUSTOMERS, staffFor, tierFor, type AdminCustomer } from '@/lib/admin';
import { formatPrice, formatDate, formatNumber } from '@/lib/format';
import { haptic, tgConfirm } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabBar } from '@/components/admin/AdminTabBar';

const initials = (name: string) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

function AdminCustomersInner() {
  const [customers, setCustomers] = useState<AdminCustomer[]>(() => DEMO_CUSTOMERS.map((c) => ({ ...c })));
  const [q, setQ] = useState('');
  // Seeded from `?id=` so /admin/loyalty's top-member rows open the sheet straight away.
  const param = useSearchParams().get('id');
  const [activeId, setActiveId] = useState<string | null>(() => param);

  const query = q.toLowerCase();
  const list = customers.filter(
    (c) => c.name.toLowerCase().includes(query) || c.userId.includes(q) || c.handle.toLowerCase().includes(query),
  );
  const active = customers.find((c) => c.id === activeId) ?? null;
  const tier = active ? tierFor(active.points) : null;
  const staff = active ? staffFor(active.handle) : null;

  const open = (id: string) => { setActiveId(id); haptic('selection'); };

  const toggleBan = async (c: AdminCustomer) => {
    if (c.status === 'banned') {
      setCustomers((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: 'active' } : x)));
      haptic('success');
      setActiveId(null);
      toast(`${c.name} unbanned`, { kind: 'success' });
    } else if (await tgConfirm(`Ban ${c.name}? They won't be able to place orders.`)) {
      setCustomers((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: 'banned' } : x)));
      haptic('warning');
      setActiveId(null);
      toast(`${c.name} banned`, { kind: 'danger' });
    }
  };

  return (
    <>
      <AdminHeader title="Customers" back="/admin" />
      <main className="screen">
        <div className="searchbar"><div className="searchbar__field"><Icon name="search" size={20} /><input aria-label="Search name, @handle or ID" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, @handle or ID" autoComplete="off" /></div></div>
        <div className="admin-section-title">{list.length} customers</div>
        <div className="list" style={{ marginTop: 0, padding: '0 16px 16px' }}>
          {list.length === 0 ? (
            <div className="empty-state"><h3>No matches</h3></div>
          ) : (
            list.map((c) => (
              <button key={c.id} className="data-row" onClick={() => open(c.id)}>
                <span className="data-row__avatar">{initials(c.name)}</span>
                <span className="data-row__main">
                  <span className="data-row__title">{c.name}
                    {c.status === 'banned' && <span className="status status--cancelled" style={{ marginInlineStart: 6 }}>Banned</span>}
                  </span>
                  <span className="data-row__sub">{c.handle} · ID {c.userId}</span>
                </span>
                <span className="data-row__end"><span className="semibold">{formatPrice(c.spent)}</span><span className="muted text-sm">{c.orders} orders</span></span>
              </button>
            ))
          )}
        </div>
      </main>
      <AdminTabBar active="customers" />

      {active && (
        <Sheet title="Customer" onClose={() => setActiveId(null)}>
          <div className="row gap-3" style={{ marginBottom: 16 }}>
            <span className="data-row__avatar" style={{ width: 56, height: 56, fontSize: 22 }}>{initials(active.name)}</span>
            <div>
              <div className="semibold" style={{ fontSize: 17 }}>{active.name}</div>
              <div className="muted text-sm">{active.handle}</div>
              <div style={{ marginTop: 4 }}>
                <span className={`status status--${active.status === 'banned' ? 'cancelled' : 'delivered'}`}>{active.status === 'banned' ? 'Banned' : 'Active'}</span>
              </div>
            </div>
          </div>

          <div className="admin-section-title" style={{ paddingInline: 0 }}>Account</div>
          <div className="card" style={{ margin: 0 }}><div className="summary">
            <div className="summary__row"><span>User ID</span><span>{active.userId}</span></div>
            <div className="summary__row"><span>Username</span><span>{active.handle}</span></div>
            <div className="summary__row"><span>Email</span><span>{active.email}</span></div>
            <div className="summary__row"><span>Phone</span><span>{active.phone}</span></div>
            <div className="summary__row"><span>Location</span><span>{active.location}</span></div>
            <div className="summary__row"><span>Joined</span><span>{formatDate(active.joined)}</span></div>
            <div className="summary__row"><span>Last active</span><span>{formatDate(active.lastActive)}</span></div>
            <div className="summary__row"><span>Loyalty</span><span>{tier?.name} · {formatNumber(active.points)} pts</span></div>
            <div className="summary__row"><span>Staff</span>
              {staff ? <span className="text-accent semibold">{staff.role}</span> : <span className="muted">Not a staff member</span>}
            </div>
          </div></div>

          <div className="kpi-grid" style={{ padding: '16px 0' }}>
            <div className="kpi"><span className="kpi__label">Orders</span><span className="kpi__value">{active.orders}</span></div>
            <div className="kpi"><span className="kpi__label">Lifetime spend</span><span className="kpi__value">{formatPrice(active.spent)}</span></div>
          </div>

          <div className="stack gap-2">
            <a className="btn btn--ghost btn--block" href="/admin/orders"><Icon name="bag" size={18} /> View orders</a>
            <button
              className={`btn btn--block ${active.status === 'banned' ? '' : 'btn--outline'}`}
              style={active.status === 'banned' ? undefined : { color: 'var(--danger)', borderColor: 'var(--danger)' }}
              onClick={() => toggleBan(active)}
            >
              {active.status === 'banned' ? 'Unban customer' : 'Ban customer'}
            </button>
          </div>
        </Sheet>
      )}
    </>
  );
}

export default function AdminCustomersPage() {
  return (
    <Suspense fallback={<div className="screen" style={{ padding: 24 }}>Loading…</div>}>
      <AdminCustomersInner />
    </Suspense>
  );
}
