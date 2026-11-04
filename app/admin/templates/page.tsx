'use client';
/**
 * Admin message templates — email/push templates the store sends (order confirmation, shipping,
 * etc.). Edit subject + body with {{merge}} tags and toggle each on/off; create a new template or
 * delete an existing one. Demo persists in memory. Structure mirrors the HTML kit (kpi-grid,
 * tabs-pill channel filter, data-row list). Uses admin.css.
 */
import { useState } from 'react';
import { haptic, tgConfirm } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Sheet } from '@/components/Sheet';
import { Switch } from '@/components/Switch';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabBar } from '@/components/admin/AdminTabBar';
import { Icon } from '@/components/Icon';

interface Tpl { id: string; name: string; channel: 'email' | 'push'; subject: string; body: string; active: boolean }
const CHANNELS: Record<string, string> = { email: '✉️', push: '🔔' };
const SEED: Tpl[] = [
  { id: 't1', name: 'Order confirmation', channel: 'email', subject: 'Your {{store}} order {{orderId}} is confirmed', body: 'Hi {{name}},\n\nThanks for your order! We’ve received {{orderId}} for {{total}} and are getting it ready.\n\n— {{store}}', active: true },
  { id: 't2', name: 'Shipping update', channel: 'email', subject: 'Your order {{orderId}} has shipped', body: 'Good news {{name}} — {{orderId}} is on its way. Track it any time from your orders page.', active: true },
  { id: 't3', name: 'Delivery confirmation', channel: 'push', subject: 'Delivered', body: 'Your {{store}} order {{orderId}} was delivered. Enjoy!', active: true },
  { id: 't4', name: 'Abandoned cart', channel: 'email', subject: 'You left something behind', body: 'Hi {{name}}, your cart is still waiting. Complete your order and it’s yours.', active: false },
  { id: 't5', name: 'Refund processed', channel: 'email', subject: 'Your refund for {{orderId}} is on the way', body: 'We’ve processed a refund of {{total}} for {{orderId}}. It may take a few business days to appear.', active: true },
  { id: 't6', name: 'Digital delivery', channel: 'email', subject: 'Your download is ready', body: 'Hi {{name}}, your digital item from {{orderId}} is ready to download from your account.', active: true },
];

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Tpl[]>(SEED);
  const [filter, setFilter] = useState<'all' | 'email' | 'push'>('all');
  const [editing, setEditing] = useState<Tpl | null>(null);
  const [creating, setCreating] = useState(false);
  // shared form state (both edit + create)
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<'email' | 'push'>('email');
  const [active, setActive] = useState(true);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const list = templates.filter((t) => filter === 'all' || t.channel === filter);

  const openEdit = (t: Tpl) => {
    setEditing(t); setName(t.name); setChannel(t.channel); setActive(t.active); setSubject(t.subject); setBody(t.body);
  };
  const openCreate = () => {
    setCreating(true); setName(''); setChannel('email'); setActive(true); setSubject(''); setBody('');
  };

  const save = () => {
    if (!editing) return;
    setTemplates((prev) => prev.map((t) => (t.id === editing.id ? { ...t, active, subject: subject.trim() || t.subject, body } : t)));
    haptic('success'); setEditing(null); toast('Template saved', { kind: 'success' });
  };

  const create = () => {
    if (!name.trim()) { haptic('error'); toast('Name is required', { kind: 'danger' }); return; }
    if (!subject.trim()) { haptic('error'); toast('Subject is required', { kind: 'danger' }); return; }
    const t: Tpl = { id: 't' + Date.now().toString(36), name: name.trim(), channel, subject: subject.trim(), body, active };
    setTemplates((prev) => [...prev, t]);
    haptic('success'); setCreating(false); toast('Template created', { kind: 'success' });
  };

  const remove = async () => {
    if (!editing) return;
    if (!(await tgConfirm(`Delete "${editing.name}"?`))) return;
    setTemplates((prev) => prev.filter((t) => t.id !== editing.id));
    haptic('success'); setEditing(null); toast('Template deleted', { kind: 'danger' });
  };

  return (
    <>
      <AdminHeader title="Templates" back="/admin" actions={<button className="appbar__btn" aria-label="New template" onClick={openCreate}><Icon name="plus" size={22} /></button>} />
      <main className="screen">
        <div className="kpi-grid">
          <div className="kpi"><span className="kpi__label"><span className="kpi__icon"><Icon name="image" size={18} /></span>Templates</span><span className="kpi__value">{templates.length}</span></div>
          <div className="kpi"><span className="kpi__label"><span className="kpi__icon"><Icon name="bell" size={18} /></span>Active</span><span className="kpi__value">{templates.filter((t) => t.active).length}</span></div>
        </div>
        <div className="tabs-pill">
          {([['all', 'All'], ['email', 'Email'], ['push', 'Push']] as const).map(([k, l]) => (
            <button key={k} className={`chip${k === filter ? ' is-active' : ''}`} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
        <div className="list" style={{ marginTop: 0, padding: '0 16px' }}>
          {list.map((t) => (
            <button key={t.id} className="data-row" onClick={() => openEdit(t)}>
              <span className="data-row__avatar">{CHANNELS[t.channel]}</span>
              <span className="data-row__main"><span className="data-row__title">{t.name}</span><span className="data-row__sub">{t.channel === 'email' ? 'Email' : 'Push'} · {t.subject}</span></span>
              <span className="data-row__end"><span className={`status status--${t.active ? 'delivered' : 'cancelled'}`}>{t.active ? 'On' : 'Off'}</span></span>
            </button>
          ))}
        </div>
      </main>
      <AdminTabBar active="dashboard" />

      {editing && (
        <Sheet title="Edit template" onClose={() => setEditing(null)}>
          <label className="row-between" style={{ padding: '0 0 12px' }}><span className="semibold">{editing.name} active</span><Switch checked={active} onChange={setActive} /></label>
          <div className="field"><label className="field__label" htmlFor="tpl-edit-subject">Subject</label><input id="tpl-edit-subject" className="input" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
          <div className="field"><label className="field__label" htmlFor="tpl-edit-body">Body</label><textarea id="tpl-edit-body" className="textarea" rows={6} style={{ minHeight: 140 }} value={body} onChange={(e) => setBody(e.target.value)} /></div>
          <p className="muted text-sm" style={{ margin: '-4px 0 12px' }}>Merge tags: {'{{name}} {{store}} {{orderId}} {{total}}'}</p>
          <button className="btn btn--block" onClick={save}>Save template</button>
          <button className="btn btn--block btn--ghost" style={{ marginTop: 8, color: 'var(--danger)' }} onClick={remove}><Icon name="trash" size={18} /> Delete template</button>
        </Sheet>
      )}

      {creating && (
        <Sheet title="New template" onClose={() => setCreating(false)}>
          <div className="field"><label className="field__label" htmlFor="tpl-create-name">Name</label><input id="tpl-create-name" className="input" placeholder="Order confirmation" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="field"><label className="field__label" htmlFor="tpl-create-channel">Channel</label>
            <select id="tpl-create-channel" className="input" value={channel} onChange={(e) => setChannel(e.target.value as 'email' | 'push')}>
              <option value="email">Email</option>
              <option value="push">Push</option>
            </select>
          </div>
          <label className="row-between" style={{ padding: '0 0 12px' }}><span className="semibold">Active</span><Switch checked={active} onChange={setActive} /></label>
          <div className="field"><label className="field__label" htmlFor="tpl-create-subject">Subject</label><input id="tpl-create-subject" className="input" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
          <div className="field"><label className="field__label" htmlFor="tpl-create-body">Body</label><textarea id="tpl-create-body" className="textarea" rows={6} style={{ minHeight: 140 }} value={body} onChange={(e) => setBody(e.target.value)} /></div>
          <p className="muted text-sm" style={{ margin: '-4px 0 12px' }}>Merge tags: {'{{name}} {{store}} {{orderId}} {{total}}'}</p>
          <button className="btn btn--block" onClick={create}>Create template</button>
        </Sheet>
      )}
    </>
  );
}
