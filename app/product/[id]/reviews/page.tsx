'use client';
/** Product reviews — faithful port: rating summary with per-star bars, review cards, write-review sheet. Uses reviews.css. */
import '../../../../styles/pages/reviews.css';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { config } from '@/config';
import { useStore } from '@/lib/store';
import { usePersistentState } from '@/lib/usePersistentState';
import { formatDate } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';

const NS = config.data.persistNamespace;
/** A rendered review — either one the shopper wrote (persisted) or one from the data service. */
interface ReviewRow { id: string; author: string; rating: number; date: string; body: string; helpful?: number }
function starRow(rating: number) {
  const full = Math.round(rating);
  return [0, 1, 2, 3, 4].map((i) => <span key={i} className={`star${i < full ? ' filled' : ''}`}>★</span>);
}
function distribution(avg: number, total: number) {
  const w = avg >= 4.5 ? [0.68, 0.2, 0.07, 0.03, 0.02] : avg >= 4 ? [0.55, 0.28, 0.1, 0.04, 0.03] : [0.4, 0.3, 0.18, 0.08, 0.04];
  const c = w.map((x) => Math.round(x * total));
  c[0] += total - c.reduce((a, b) => a + b, 0);
  return c;
}

export default function ReviewsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getProduct, getReviews } = useStore();
  const product = getProduct(id);
  const [userReviews, setUserReviews] = usePersistentState<ReviewRow[]>(`${NS}:reviews:${id}`, []);
  const [writing, setWriting] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');

  if (!product) {
    return (
      <>
        <header className="reviews-page-header"><div className="header-top"><button className="back-button" aria-label="Back" onClick={() => router.push('/catalog')}><Icon name="back" size={24} /></button><h1 className="page-title">Reviews</h1><span style={{ width: 40 }} /></div></header>
        <main className="screen"><div className="empty-state"><div className="empty-state__emoji">🧐</div><h3>Product not found</h3></div></main>
      </>
    );
  }

  // Reviews for THIS product (deterministic per product id), newest shopper reviews first.
  const reviews: ReviewRow[] = [...userReviews, ...getReviews(product.id)];
  const total = product.reviewCount;
  const dist = distribution(product.rating, total);
  const max = Math.max(...dist, 1);

  const submit = () => {
    const text = body.trim();
    if (!text) { toast('Please write a few words', { kind: 'danger' }); return; }
    setUserReviews((prev) => [{ id: 'new-' + Date.now().toString(36), author: 'You', rating, date: new Date().toISOString(), body: text }, ...prev]);
    haptic('success');
    setWriting(false);
    setBody('');
    setRating(5);
    toast('Review submitted (demo)', { kind: 'success' });
  };

  return (
    <>
      <header className="reviews-page-header"><div className="header-top">
        <button className="back-button" aria-label="Back" onClick={() => router.push(`/product/${id}`)}><Icon name="back" size={24} /></button>
        <h1 className="page-title">Reviews</h1>
        <span style={{ width: 40 }} />
      </div></header>

      <main className="screen">
        <div className="reviews-section">
          <div className="reviews-header"><h3 className="section-title">Customer Reviews</h3><button className="write-review-btn" onClick={() => setWriting(true)}>Write Review</button></div>
          <div className="reviews-summary"><div className="rating-breakdown">
            <div className="overall-rating"><span className="rating-number">{product.rating.toFixed(1)}</span><div className="rating-stars-large">{starRow(product.rating)}</div><span className="total-reviews">{total} reviews</span></div>
            <div className="rating-bars">{dist.map((count, i) => (
              <div key={i} className="rating-bar"><span className="bar-label">{5 - i}★</span><div className="bar-fill"><div className="bar-progress" style={{ width: `${Math.round((count / max) * 100)}%` }} /></div><span className="bar-count">{count}</span></div>
            ))}</div>
          </div></div>
          <div className="reviews-list">{reviews.map((r) => (
            <div key={r.id} className="review-item">
              <div className="review-header"><div className="reviewer-info"><span className="reviewer-name">{r.author}</span><div className="review-rating">{starRow(r.rating)}</div></div><span className="review-date">{formatDate(r.date)}</span></div>
              <div className="review-comment">{r.body}</div>
              <div className="review-actions"><button className="helpful-btn" onClick={() => { haptic('light'); toast('Thanks for your feedback'); }}>👍 Helpful ({r.helpful ?? Math.max(2, Math.round(r.rating * 3))})</button></div>
            </div>
          ))}</div>
        </div>
      </main>

      {writing && (
        <Sheet title="Write a review" onClose={() => setWriting(false)}>
          <div className="star-picker">{[1, 2, 3, 4, 5].map((i) => <button key={i} className={i <= rating ? 'on' : ''} onClick={() => { setRating(i); haptic('selection'); }}>★</button>)}</div>
          <div className="field"><label className="field__label">Your review</label><textarea className="textarea" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share your experience with this product" /></div>
          <button className="btn btn--block" onClick={submit}>Submit review</button>
        </Sheet>
      )}
    </>
  );
}
