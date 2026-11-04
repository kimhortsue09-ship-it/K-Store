'use client';
/** Admin Q&A moderation — answer or remove product questions. Uses admin.css + features.css. */
import '../../../styles/pages/features.css';
import { useEffect, useState } from 'react';
import { config } from '@/config';
import { usePersistentState } from '@/lib/usePersistentState';
import { formatDate } from '@/lib/format';
import { haptic, tgConfirm } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabBar } from '@/components/admin/AdminTabBar';

const NS = config.data.persistNamespace;
interface QA { id: string; productId: string; productName: string; question: string; answer: string; author: string; date: string; status?: string }
const SEED: QA[] = [
  { id: 'qa-seed-1', productId: 'p-101', productName: 'Wireless Headphones', question: 'Is this compatible with iPhone 15?', answer: '', author: 'Marco D.', date: '2024-06-24T00:00:00Z' },
  { id: 'qa-seed-2', productId: 'p-204', productName: 'Productivity Course', question: 'Do I get lifetime access?', answer: 'Yes — one purchase gives you lifetime access plus all future updates.', author: 'Lena V.', date: '2024-06-22T00:00:00Z' },
  { id: 'qa-seed-3', productId: 'p-101', productName: 'Wireless Headphones', question: 'What is the battery life?', answer: '', author: 'Ade O.', date: '2024-06-21T00:00:00Z' },
];

export default function AdminQuestionsPage() {
  const [all, setAll, ready] = usePersistentState<QA[]>(`${NS}:qa`, []);
  useEffect(() => { if (ready && all.length === 0) setAll(SEED); /* eslint-disable-next-line */ }, [ready]);
  const [filter, setFilter] = useState('pending');
  const [answering, setAnswering] = useState<QA | null>(null);
  const [text, setText] = useState('');

  const list = all.filter((q) => filter === 'all' || (filter === 'pending' ? !q.answer : Boolean(q.answer)));
  const pending = all.filter((q) => !q.answer).length;
  const openAnswer = (q: QA) => { setAnswering(q); setText(q.answer || ''); };
  const publish = () => { if (!answering) return; if (!text.trim()) { toast('Please write an answer', { kind: 'danger' }); return; } setAll((prev) => prev.map((q) => (q.id === answering.id ? { ...q, answer: text.trim(), status: 'answered' } : q))); haptic('success'); toast('Answer published', { kind: 'success' }); setAnswering(null); setText(''); };
  const remove = async (id: string) => { if (await tgConfirm('Remove this question?')) { setAll((prev) => prev.filter((q) => q.id !== id)); toast('Removed'); } };

  return (
    <>
      <AdminHeader title="Questions & Answers" back="/admin" />
      <main className="screen">
        <div className="kpi-grid">
          <div className="kpi"><span className="kpi__label"><span className="kpi__icon"><Icon name="help" size={18} /></span>Total questions</span><span className="kpi__value">{all.length}</span></div>
          <div className="kpi"><span className="kpi__label"><span className="kpi__icon"><Icon name="bell" size={18} /></span>Awaiting answer</span><span className="kpi__value">{pending}</span></div>
        </div>
        <div className="tabs-pill">{[['pending', 'Pending'], ['answered', 'Answered'], ['all', 'All']].map(([k, l]) => <button key={k} className={`chip${k === filter ? ' is-active' : ''}`} onClick={() => setFilter(k)}>{l}</button>)}</div>
        <div className="container" style={{ paddingTop: 0 }}>
          {list.length ? list.map((q) => {
            const answered = Boolean(q.answer);
            return (
              <div key={q.id} className="card card--pad" style={{ marginBottom: 12 }}>
                <div className="row-between"><span className="muted text-sm">{q.productName}</span><span className={`status status--${answered ? 'delivered' : 'pending'}`}>{answered ? 'Answered' : 'Pending'}</span></div>
                <div className="qa-q" style={{ marginTop: 10 }}><span className="qa-q__badge">Q</span><span>{q.question}</span></div>
                {answered && <div className="qa-a"><span className="qa-a__badge">A</span><span>{q.answer}</span></div>}
                <div className="qa-meta">Asked by {q.author} · {formatDate(q.date)}</div>
                <div className="row gap-3" style={{ marginTop: 12 }}>
                  <button className="text-accent semibold text-sm" onClick={() => openAnswer(q)}>{answered ? 'Edit answer' : 'Answer'}</button>
                  <button className="semibold text-sm" style={{ color: 'var(--danger)' }} onClick={() => remove(q.id)}>Remove</button>
                </div>
              </div>
            );
          }) : <p className="muted text-sm">Nothing here.</p>}
        </div>
      </main>
      <AdminTabBar active="dashboard" />

      {answering && (
        <Sheet title="Answer question" onClose={() => setAnswering(null)}>
          <div className="qa-q" style={{ marginBottom: 12 }}><span className="qa-q__badge">Q</span><span>{answering.question}</span></div>
          <div className="field"><label className="field__label" htmlFor="qa-answer">Your answer</label><textarea id="qa-answer" className="textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder="Reply to the customer" /></div>
          <button className="btn btn--block" onClick={publish}>Publish answer</button>
        </Sheet>
      )}
    </>
  );
}
