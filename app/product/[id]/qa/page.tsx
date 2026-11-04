'use client';
/** Product Q&A — faithful port: question/answer list + ask sheet. Uses features.css. */
import '../../../../styles/pages/features.css';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { config } from '@/config';
import { useStore } from '@/lib/store';
import { usePersistentState } from '@/lib/usePersistentState';
import { formatDate } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import type { Product } from '@/lib/types';

const NS = config.data.persistNamespace;

/**
 * A customer question. Shared with the admin Q&A screen through `nova:qa`, so it must carry
 * `productName` (the admin lists questions by product) and `status` — dropping either breaks
 * moderation.
 */
export interface QA {
  id: string;
  productId: string;
  productName: string;
  question: string;
  answer: string;
  author: string;
  date: string;
  status: 'pending' | 'answered';
}

/** Demo Q&As, seeded into the shared store once per product (so the admin sees them too). */
function seedFor(p: Product): QA[] {
  return [
    { id: `qa-${p.id}-1`, productId: p.id, productName: p.name, question: `Does the ${p.name} come with a warranty?`, answer: 'Yes — all products include a 12-month warranty.', author: 'Sam R.', date: '2024-06-20T00:00:00Z', status: 'answered' },
    { id: `qa-${p.id}-2`, productId: p.id, productName: p.name, question: 'How long does delivery take?', answer: p.type === 'digital' ? 'Digital items are delivered instantly.' : 'Standard delivery is 3–5 business days.', author: 'Priya K.', date: '2024-06-18T00:00:00Z', status: 'answered' },
  ];
}

export default function QAPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getProduct } = useStore();
  const product = getProduct(id);
  const [all, setAll, ready] = usePersistentState<QA[]>(`${NS}:qa`, []);
  const [asking, setAsking] = useState(false);
  const [q, setQ] = useState('');

  // Seed the demo Q&As into the shared store the first time this product is viewed.
  useEffect(() => {
    if (!ready || !product) return;
    setAll((prev) => (prev.some((x) => x.productId === product.id) ? prev : [...prev, ...seedFor(product)]));
  }, [ready, product, setAll]);

  if (!product) {
    return (
      <>
        <header className="page-header"><div className="header-top"><button className="hbtn" aria-label="Back" onClick={() => router.push('/catalog')}><Icon name="back" size={24} /></button><div className="htitle"><h1>Questions</h1></div><span style={{ width: 40 }} /></div></header>
        <main className="screen"><div className="empty-state"><div className="empty-state__emoji">🧐</div><h3>Product not found</h3></div></main>
      </>
    );
  }

  const list = all.filter((x) => x.productId === id);
  const ask = () => {
    const text = q.trim();
    if (!text) { toast('Please type your question', { kind: 'danger' }); return; }
    setAll((prev) => [{ id: 'qa-' + Date.now().toString(36), productId: product.id, productName: product.name, question: text, answer: '', author: 'You', date: new Date().toISOString(), status: 'pending' }, ...prev]);
    haptic('success');
    setAsking(false);
    setQ('');
    toast('Question submitted', { kind: 'success' });
  };

  return (
    <>
      <header className="page-header"><div className="header-top">
        <button className="hbtn" aria-label="Back" onClick={() => router.push(`/product/${id}`)}><Icon name="back" size={24} /></button>
        <div className="htitle"><h1>Questions &amp; Answers</h1><span>{product.name}</span></div>
        <button className="hbtn" aria-label="Ask" onClick={() => setAsking(true)}><Icon name="plus" size={24} /></button>
      </div></header>

      <main className="screen">
        <div className="feat-content">
          {list.length ? list.map((item) => (
            <div key={item.id} className="qa-item">
              <div className="qa-q"><span className="qa-q__badge">Q</span><span>{item.question}</span></div>
              {item.answer ? <div className="qa-a"><span className="qa-a__badge">A</span><span>{item.answer}</span></div> : <div className="qa-meta">⏳ Awaiting an answer from the store</div>}
              <div className="qa-meta">Asked by {item.author} · {formatDate(item.date)}</div>
            </div>
          )) : (
            <div className="empty-state" style={{ paddingTop: 40 }}>
              <div className="empty-state__emoji">❓</div>
              <h3>No questions yet</h3>
              <p>Be the first to ask about this product.</p>
            </div>
          )}
          <button className="btn btn--outline btn--block" style={{ marginTop: 8 }} onClick={() => setAsking(true)}><Icon name="help" size={18} /> Ask a question</button>
        </div>
      </main>

      {asking && (
        <Sheet title="Ask a question" onClose={() => setAsking(false)}>
          <div className="field"><label className="field__label">Your question</label><textarea className="textarea" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask anything about this product" /></div>
          <button className="btn btn--block" onClick={ask}>Submit question</button>
        </Sheet>
      )}
    </>
  );
}
