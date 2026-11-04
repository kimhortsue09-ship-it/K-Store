'use client';
/**
 * Support (customer) — faithful port of pages/support.js: a ticket list that opens into a
 * conversation thread with a compose bar, plus a "new ticket" sheet. Tickets persist under
 * `nova:tickets` (the SAME key + shape the admin Support page reads/writes). Uses extra.css.
 */
import '../../styles/pages/extra.css';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { config } from '@/config';
import { usePersistentState } from '@/lib/usePersistentState';
import { formatDate } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';

/** Shared ticket shape — identical to the admin Support page (`from: 'them'` = agent). */
interface Message { from: 'me' | 'them'; text: string; date: string }
interface Ticket { id: string; subject: string; status: 'open' | 'resolved'; date: string; messages: Message[] }

const KEY = `${config.data.persistNamespace}:tickets`;
const SEED: Ticket[] = [
  {
    id: 'tk-1001', subject: 'Where is my order NV-1002?', status: 'open', date: '2024-07-02T09:00:00Z',
    messages: [
      { from: 'me', text: 'Hi, my order shows shipped but no tracking updates in 3 days.', date: '2024-07-02T09:00:00Z' },
      { from: 'them', text: 'Thanks for reaching out! Your parcel is in transit and should arrive by Friday. Here is your tracking link.', date: '2024-07-02T10:15:00Z' },
    ],
  },
];

export default function SupportPage() {
  const router = useRouter();
  // `null` = key absent → seed once (matches the HTML `seed()`); an empty array stays empty,
  // so deleting/resolving down to zero tickets shows the empty state instead of re-seeding.
  const [stored, setStored, ready] = usePersistentState<Ticket[] | null>(KEY, null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [subj, setSubj] = useState('');
  const [msg, setMsg] = useState('');
  const [reply, setReply] = useState('');

  useEffect(() => {
    if (ready && stored === null) setStored(SEED);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const list = stored ?? [];
  const active = list.find((t) => t.id === openId) ?? null;

  const nowIso = () => new Date().toISOString();

  const createTicket = () => {
    const s = subj.trim(), m = msg.trim();
    if (!s || !m) { toast('Add a subject and message', { kind: 'danger' }); return; }
    const id = 'tk-' + Date.now().toString(36);
    const ticket: Ticket = { id, subject: s, status: 'open', date: nowIso(), messages: [{ from: 'me', text: m, date: nowIso() }] };
    setStored((prev) => [ticket, ...(prev ?? [])]);
    haptic('success');
    setCreating(false); setSubj(''); setMsg('');
    setOpenId(id);
  };

  const send = () => {
    const text = reply.trim();
    if (!text || !active) return;
    setStored((prev) => (prev ?? []).map((t) => (t.id === active.id ? { ...t, messages: [...t.messages, { from: 'me' as const, text, date: nowIso() }] } : t)));
    haptic('light');
    setReply('');
  };

  /* ---- Thread view ---- */
  if (active) {
    return (
      <>
        <header className="page-header"><div className="header-top">
          <button className="hbtn" aria-label="Back" onClick={() => { setOpenId(null); setReply(''); }}><Icon name="back" size={24} /></button>
          <div className="htitle"><h1>{active.subject}</h1><span>Ticket {active.id}</span></div>
          <span className="hbtn" style={{ visibility: 'hidden' }} />
        </div></header>

        <main className="screen">
          <div className="thread" style={{ paddingBottom: 80 }}>
            {active.messages.map((m, i) => (
              <div key={i} className={`bubble ${m.from === 'me' ? 'me' : 'them'}`}>{m.text}<span className="bubble__time">{formatDate(m.date)}</span></div>
            ))}
          </div>
          <div className="thread-compose">
            <input className="input" value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder="Type a message…" autoComplete="off" />
            <button className="btn" aria-label="Send" onClick={send}><Icon name="send" size={18} /></button>
          </div>
        </main>
      </>
    );
  }

  /* ---- List view ---- */
  return (
    <>
      <header className="page-header"><div className="header-top">
        <button className="hbtn" aria-label="Back" onClick={() => router.push('/profile')}><Icon name="back" size={24} /></button>
        <div className="htitle"><h1>Support</h1><span>Your conversations</span></div>
        <button className="hbtn" aria-label="New ticket" onClick={() => setCreating(true)}><Icon name="plus" size={24} /></button>
      </div></header>

      <main className="screen">
        {list.length ? (
          <div className="list" style={{ marginTop: 16 }}>
            {list.map((tk) => (
              <button key={tk.id} className="ticket-item" onClick={() => setOpenId(tk.id)}>
                <span className="ticket-item__icon"><Icon name="help" size={18} /></span>
                <span className="ticket-item__body"><span className="ticket-item__title">{tk.subject}</span><span className="ticket-item__sub">{tk.messages[tk.messages.length - 1]?.text}</span></span>
                <span className={`status status--${tk.status === 'open' ? 'shipped' : 'delivered'}`}>{tk.status}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ paddingTop: 60 }}>
            <div className="empty-state__emoji">💬</div>
            <h3>No conversations</h3><p>Start a ticket and our team will reply.</p>
            <button className="btn" onClick={() => setCreating(true)}>New ticket</button>
          </div>
        )}
      </main>

      {creating && (
        <Sheet title="New ticket" onClose={() => setCreating(false)}>
          <div className="field"><label className="field__label">Subject</label><input className="input" value={subj} onChange={(e) => setSubj(e.target.value)} placeholder="How can we help?" /></div>
          <div className="field"><label className="field__label">Message</label><textarea className="textarea" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Describe your issue" /></div>
          <button className="btn btn--block" onClick={createTicket}>Send</button>
        </Sheet>
      )}
    </>
  );
}
