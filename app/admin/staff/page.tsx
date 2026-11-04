'use client';
/**
 * Admin staff & roles — mirrors admin/staff.js: an "N team members" section over a list of
 * data-rows (avatar, name, handle, role status pill). The header plus button opens an "Invite
 * teammate" sheet; tapping a row opens a "Manage member" sheet with role select, active toggle
 * and remove (tgConfirm). All mutations are in-memory demo state with toast + haptic feedback.
 */
import { useState } from 'react';
import { DEMO_STAFF } from '@/lib/admin';
import { haptic, tgConfirm } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Switch } from '@/components/Switch';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabBar } from '@/components/admin/AdminTabBar';

const ROLES = ['Owner', 'Manager', 'Support', 'Fulfilment'];
const initials = (n: string) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

interface Member { id: string; name: string; handle: string; role: string; active: boolean }

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<Member[]>(() =>
    DEMO_STAFF.map((s) => ({ id: s.id, name: s.name, handle: s.handle, role: s.role, active: s.active })),
  );

  // Invite sheet
  const [inviting, setInviting] = useState(false);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [inviteRole, setInviteRole] = useState('Support');

  // Manage sheet
  const [managing, setManaging] = useState<Member | null>(null);

  const openInvite = () => { setName(''); setHandle(''); setInviteRole('Support'); setInviting(true); haptic('selection'); };
  const sendInvite = () => {
    if (!name.trim()) { toast('Name is required', { kind: 'danger' }); haptic('error'); return; }
    setStaff((prev) => [...prev, { id: 's' + (prev.length + 1), name: name.trim(), handle: handle.trim() || '@new', role: inviteRole, active: true }]);
    haptic('success'); setInviting(false); toast('Invite sent (demo)', { kind: 'success' });
  };

  const changeRole = (id: string, role: string) => {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, role } : s)));
    setManaging((m) => (m && m.id === id ? { ...m, role } : m));
    haptic('selection');
  };
  const toggleActive = (id: string) => {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
    setManaging((m) => (m && m.id === id ? { ...m, active: !m.active } : m));
  };
  const remove = async (m: Member) => {
    if (!(await tgConfirm(`Remove ${m.name} from the team?`))) return;
    setStaff((prev) => prev.filter((s) => s.id !== m.id));
    haptic('success'); setManaging(null); toast('Member removed (demo)', { kind: 'success' });
  };

  return (
    <>
      <AdminHeader title="Staff" back="/admin" actions={<button className="appbar__btn" aria-label="Invite" onClick={openInvite}><Icon name="plus" size={22} /></button>} />
      <main className="screen">
        <div className="admin-section-title">{staff.length} team members</div>
        <div className="list" style={{ marginTop: 0, padding: '0 16px 16px' }}>
          {staff.map((m) => (
            <button key={m.id} className="data-row" onClick={() => { setManaging(m); haptic('selection'); }}>
              <span className="data-row__avatar">{initials(m.name)}</span>
              <span className="data-row__main">
                <span className="data-row__title">{m.name}</span>
                <span className="data-row__sub">{m.handle}</span>
              </span>
              <span className={`status status--${m.role === 'Owner' ? 'paid' : 'delivered'}`}>{m.role}</span>
            </button>
          ))}
        </div>
      </main>
      <AdminTabBar active="dashboard" />

      {inviting && (
        <Sheet title="Invite teammate" onClose={() => setInviting(false)}>
          <div className="field"><label className="field__label" htmlFor="staff-invite-name">Name</label><input id="staff-invite-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" /></div>
          <div className="field"><label className="field__label" htmlFor="staff-invite-handle">Telegram handle</label><input id="staff-invite-handle" className="input" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@jane" /></div>
          <div className="field"><label className="field__label" htmlFor="staff-invite-role">Role</label>
            <select id="staff-invite-role" className="select" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></div>
          <button className="btn btn--block" onClick={sendInvite}>Send invite</button>
        </Sheet>
      )}

      {managing && (
        <Sheet title="Manage member" onClose={() => setManaging(null)}>
          <div className="row-between" style={{ marginBottom: 16 }}>
            <div><div className="semibold">{managing.name}</div><div className="muted text-sm">{managing.handle}</div></div>
            <span className={`status status--${managing.role === 'Owner' ? 'paid' : 'delivered'}`}>{managing.role}</span>
          </div>
          <div className="field"><label className="field__label" htmlFor="staff-manage-role">Role</label>
            <select id="staff-manage-role" className="select" value={managing.role} onChange={(e) => changeRole(managing.id, e.target.value)}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></div>
          <div className="row-between" style={{ padding: '12px 0' }}>
            <span className="field__label" style={{ margin: 0 }}>Active</span>
            <Switch checked={managing.active} onChange={() => toggleActive(managing.id)} />
          </div>
          <button className="btn btn--block btn--outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => remove(managing)}>Remove member</button>
        </Sheet>
      )}
    </>
  );
}
