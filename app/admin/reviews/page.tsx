'use client';
/** Admin reviews — moderate customer reviews (filter, approve, hide). Mirrors assets/js/admin/reviews.js. */
import { useState } from 'react';
import { formatDate } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminTabBar } from '@/components/admin/AdminTabBar';

type ReviewStatus = 'pending' | 'approved' | 'hidden';
interface Review { id: string; product: string; author: string; rating: number; body: string; date: string; status: ReviewStatus }

const SEED: Review[] = [
  { id: 'rv1', product: 'Aurora Wireless Earbuds', author: 'Marco D.', rating: 5, body: 'Amazing sound and battery life — best earbuds I have owned.', date: '2024-06-24', status: 'pending' },
  { id: 'rv2', product: 'Aurora Wireless Earbuds', author: 'Priya S.', rating: 4, body: 'Great value, comfortable fit for long calls.', date: '2024-06-23', status: 'approved' },
  { id: 'rv3', product: 'Nimbus 5G Phone', author: 'Lena V.', rating: 5, body: 'Fast, bright screen and the camera is superb.', date: '2024-06-22', status: 'pending' },
  { id: 'rv4', product: 'Nimbus 5G Phone', author: 'Anon', rating: 1, body: 'Spam link http://example.com buy cheap now', date: '2024-06-21', status: 'hidden' },
  { id: 'rv5', product: 'Trailblazer Jacket', author: 'Owen R.', rating: 4, body: 'Warm and lightweight, runs a touch small.', date: '2024-06-20', status: 'approved' },
];

const FILTERS = ['pending', 'approved', 'hidden', 'all'] as const;
type Filter = (typeof FILTERS)[number];

/** Mirrors ratingStars() from components.js — five stars plus the numeric value. */
function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="rating">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`star${i < Math.round(rating) ? ' is-on' : ''}`}>
          <Icon name="star" size={13} filled={i < Math.round(rating)} />
        </span>
      ))}
      <span className="rating__value">{rating.toFixed(1)}</span>
    </span>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>(SEED);
  const [filter, setFilter] = useState<Filter>('pending');
  const list = reviews.filter((r) => filter === 'all' || r.status === filter);

  const setStatus = (id: string, status: ReviewStatus) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    haptic('success');
    toast(`Review ${status}`, { kind: status === 'approved' ? 'success' : 'default' });
  };

  return (
    <>
      <AdminHeader title="Reviews" back="/admin" />
      <main className="screen">
        <div className="tabs-pill">
          {FILTERS.map((s) => (
            <button key={s} className={`chip${s === filter ? ' is-active' : ''}`} onClick={() => setFilter(s)}>
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        {list.length ? (
          <div className="stack">
            {list.map((r) => (
              <div key={r.id} className="card card--pad" data-review={r.id}>
                <div className="row-between">
                  <div className="semibold">
                    {r.author} <span className="muted text-sm">on {r.product}</span>
                  </div>
                  <span className="muted text-sm">{formatDate(r.date)}</span>
                </div>
                <div style={{ margin: '6px 0' }}><RatingStars rating={r.rating} /></div>
                <div className="text-sm">{r.body}</div>
                <div className="row gap-2" style={{ marginTop: 12 }}>
                  {r.status === 'pending' ? (
                    <>
                      <button className="btn btn--sm" onClick={() => setStatus(r.id, 'approved')}>
                        <Icon name="check" size={16} /> Approve
                      </button>
                      <button className="btn btn--sm btn--outline" onClick={() => setStatus(r.id, 'hidden')}>Hide</button>
                    </>
                  ) : (
                    <span className={`status status--${r.status === 'approved' ? 'delivered' : 'cancelled'}`}>{r.status}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state__emoji">⭐</div>
            <h3>No {filter} reviews</h3>
          </div>
        )}
      </main>
      <AdminTabBar active="dashboard" />
    </>
  );
}
