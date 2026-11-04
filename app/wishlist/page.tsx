'use client';
/**
 * Wishlist / Favorites — faithful port: filter tabs, sort, product grid, and a bulk-select
 * edit mode (add-to-cart / remove). Uses wishlist.css + the shared .pcard card.
 */
import '../../styles/pages/wishlist.css';
import { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { toast } from '@/lib/toast';
import { haptic } from '@/lib/telegram';
import { Icon } from '@/components/Icon';
import { TabBar } from '@/components/TabBar';
import { ProductCard } from '@/components/ProductCard';
import type { Product } from '@/lib/types';

export default function WishlistPage() {
  const { wishlist, getProduct, toggleWishlist, addToCart } = useStore();
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  let items = wishlist.map(getProduct).filter(Boolean) as Product[];
  if (filter !== 'all') items = items.filter((p) => p.type === filter);
  if (sort === 'price-low') items = [...items].sort((a, b) => a.price - b.price);
  else if (sort === 'price-high') items = [...items].sort((a, b) => b.price - a.price);
  else if (sort === 'rating') items = [...items].sort((a, b) => b.rating - a.rating);

  const toggleSel = (id: string) => setSelected((prev) => {
    const n = new Set(prev);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const exitEdit = () => { setEditMode(false); setSelected(new Set()); };

  const bulkRemove = () => {
    const n = selected.size;
    selected.forEach((id) => toggleWishlist(id));
    haptic('medium');
    toast(`${n} removed`);
    exitEdit();
  };

  // Selection is resolved against the *whole* wishlist, not the filtered view — switching tabs
  // after selecting must not silently drop items (the HTML edition selects from all products).
  const bulkAdd = () => {
    const picks = [...selected].map(getProduct).filter(Boolean) as Product[];
    picks.forEach((p) => addToCart(p));
    haptic('success');
    toast(`${picks.length} added to cart`, { kind: 'success' });
    exitEdit();
  };

  return (
    <>
      <header className="favorites-header">
        <div className="header-top">
          <span style={{ width: 44 }} />
          <div className="header-center">
            <h1 className="page-title">{t('nav.wishlist')}</h1>
            <span className="favorites-subtitle">{t(items.length === 1 ? 'wishlist.saved_one' : 'wishlist.saved_many', { count: items.length })}</span>
          </div>
          {items.length ? (
            <button className="edit-button" onClick={() => (editMode ? exitEdit() : setEditMode(true))}>{editMode ? t('action.done') : t('action.edit')}</button>
          ) : (
            <span style={{ width: 44 }} />
          )}
        </div>
      </header>

      {items.length === 0 ? (
        <main className="screen">
          <div className="empty-state" style={{ paddingTop: 60 }}>
            <div className="empty-state__emoji">🤍</div>
            <h3>{t('wishlist.empty')}</h3>
            <p>{t('wishlist.empty_hint')}</p>
            <Link className="btn" href="/catalog">{t('nav.catalog')}</Link>
          </div>
        </main>
      ) : (
        <main className="screen">
          <div className="favorites-content">
            <div className="filter-tabs">
              {[['all', 'filter.all'], ['physical', 'filter.physical'], ['digital', 'filter.digital']].map(([id, l]) => (
                <button key={id} className={`filter-tab${filter === id ? ' active' : ''}`} onClick={() => setFilter(id)}>{t(l)}</button>
              ))}
            </div>
            <div className="sort-section">
              <span className="results-count">{t('wishlist.showing', { count: items.length })}</span>
              <select id="wishlist-sort" aria-label={t('catalog.sort_label')} className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                {[['newest', 'sort.newest_short'], ['price-low', 'sort.price_low_short'], ['price-high', 'sort.price_high_short'], ['rating', 'sort.rating_short']].map(([v, l]) => (
                  <option key={v} value={v}>{t(l)}</option>
                ))}
              </select>
            </div>
            <div className="favorites-grid">
              {items.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  selectable={editMode}
                  selected={selected.has(p.id)}
                  onSelect={() => toggleSel(p.id)}
                />
              ))}
            </div>
          </div>
        </main>
      )}

      {editMode && items.length > 0 && (
        <div className="bulk-actions">
          <span className="bulk-info">{t('wishlist.selected', { count: selected.size })}</span>
          <div className="bulk-buttons">
            <button className="btn btn--sm btn--ghost" onClick={bulkAdd}><Icon name="cart" size={16} /> {t('action.add')}</button>
            <button className="btn btn--sm btn--outline" onClick={bulkRemove} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>{t('action.remove')}</button>
          </div>
        </div>
      )}

      <TabBar />
    </>
  );
}
