'use client';
/**
 * Catalog — faithful port of the HTML products page: sticky header, type filter, category
 * chips, subcategory chips, sort row, the full product-card grid and the filter sheet
 * (max price / minimum rating / include out of stock). Uses catalog.css.
 */
import '../../styles/pages/catalog.css';
import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { formatPrice } from '@/lib/format';
import { t } from '@/lib/i18n';
import { productArt } from '@/lib/productArt';
import { toast } from '@/lib/toast';
import { haptic } from '@/lib/telegram';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { Switch } from '@/components/Switch';
import { TabBar } from '@/components/TabBar';
import type { Product } from '@/lib/types';

/** Price / rating / availability filters — the state behind the filter sheet. */
interface Filters {
  maxPrice: number;
  rating: number;
  outOfStock: boolean;
}

const DEFAULT_FILTERS: Filters = { maxPrice: 1000, rating: 0, outOfStock: false };

function stars(rating: number) {
  const full = Math.round(rating);
  return [0, 1, 2, 3, 4].map((i) => (
    <span key={i} className={`star${i < full ? ' filled' : ''}`}>★</span>
  ));
}

function CatalogInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { products, categories } = useStore();
  const [type, setType] = useState(params.get('type') || 'all');
  const [category, setCategory] = useState(params.get('category') || 'all');
  const [subcategory, setSubcategory] = useState(params.get('subcategory') || 'all');
  const [sort, setSort] = useState(params.get('sort') || 'newest');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const list = useMemo(() => {
    let items = products.filter((p) =>
      (type === 'all' || p.type === type)
      && (category === 'all' || p.categoryId === category)
      && (subcategory === 'all' || p.subcategoryId === subcategory)
      && (p.inStock || filters.outOfStock)
      && p.price <= filters.maxPrice
      && p.rating >= filters.rating);
    if (sort === 'price-low') items = [...items].sort((a, b) => a.price - b.price);
    else if (sort === 'price-high') items = [...items].sort((a, b) => b.price - a.price);
    // `popular` maps to rating, exactly like the HTML edition's SORT_MAP.
    else if (sort === 'rating' || sort === 'popular') items = [...items].sort((a, b) => b.rating - a.rating);
    return items;
  }, [products, type, category, subcategory, sort, filters]);

  const cat = categories.find((c) => c.id === category);

  return (
    <>
      <header className="products-header">
        <div className="header-top">
          <button className="back-button" aria-label="Back" onClick={() => router.push('/')}><Icon name="back" size={24} /></button>
          <div className="header-center">
            <h1 className="page-title">{t('catalog.title')}</h1>
            <span className="product-count">{t('catalog.count', { count: list.length })}</span>
          </div>
          <button className="filter-button" aria-label={t('catalog.filter')} onClick={() => { haptic('selection'); setFilterOpen(true); }}>
            <Icon name="filter" size={24} />
          </button>
        </div>
      </header>

      <main className="screen">
        <div className="products-content">
          <div className="product-type-filter">
            {[['all', 'filter.all_products'], ['physical', 'filter.physical'], ['digital', 'filter.digital']].map(([id, label]) => (
              <button key={id} className={`type-button${type === id ? ' active' : ''}`} onClick={() => { setType(id); }}>{t(label)}</button>
            ))}
          </div>

          <div className="category-filter">
            <div className="category-scroll">
              <button className={`category-chip${category === 'all' ? ' active' : ''}`} onClick={() => { setCategory('all'); setSubcategory('all'); }}>{t('filter.all')}</button>
              {categories.map((c) => (
                <button key={c.id} className={`category-chip${category === c.id ? ' active' : ''}`} onClick={() => { setCategory(c.id); setSubcategory('all'); }}>{c.icon} {c.name}</button>
              ))}
            </div>
          </div>

          {cat?.subcategories?.length ? (
            <div className="subcategory-filter">
              <div className="subcategory-title">{t('catalog.subcategories')}</div>
              <div className="subcategory-scroll">
                <button className={`subcategory-chip${subcategory === 'all' ? ' active' : ''}`} onClick={() => setSubcategory('all')}>{t('filter.all')}</button>
                {cat.subcategories.map((s) => (
                  <button key={s.id} className={`subcategory-chip${subcategory === s.id ? ' active' : ''}`} onClick={() => setSubcategory(s.id)}>{s.name}</button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="sort-section">
            <span className="results-count">{t('catalog.showing', { count: list.length })}</span>
            <select id="catalog-sort" aria-label={t('catalog.sort_label')} className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              {[['newest', 'sort.newest'], ['price-low', 'sort.price_low'], ['price-high', 'sort.price_high'], ['rating', 'sort.rating'], ['popular', 'sort.popular']].map(([v, l]) => (
                <option key={v} value={v}>{t(l)}</option>
              ))}
            </select>
          </div>

          {list.length ? (
            <div className="products-grid">
              {list.map((p) => (
                <ProductGridCard key={p.id} product={p} onOpen={() => router.push(`/product/${p.id}`)} />
              ))}
            </div>
          ) : (
            <div className="empty-products">
              <div className="empty-icon">📦</div>
              <h3 className="empty-title">{t('catalog.empty')}</h3>
              <p>{t('catalog.empty_hint')}</p>
            </div>
          )}
        </div>
      </main>

      <TabBar />

      {filterOpen && (
        <FilterSheet
          filters={filters}
          onClose={() => setFilterOpen(false)}
          onApply={(next) => {
            setFilters(next);
            setFilterOpen(false);
            haptic('success');
            toast(t('catalog.filters_applied'));
          }}
        />
      )}
    </>
  );
}

/** The "Filter products" bottom sheet: max-price slider, minimum-rating segments, out-of-stock switch. */
function FilterSheet({ filters, onClose, onApply }: { filters: Filters; onClose: () => void; onApply: (f: Filters) => void }) {
  const [draft, setDraft] = useState<Filters>(filters);

  return (
    <Sheet title={t('catalog.filter_title')} onClose={onClose}>
      <div className="field">
        <label className="field__label" htmlFor="flt-maxprice">{t('catalog.max_price')} <span>{formatPrice(draft.maxPrice)}</span></label>
        <input
          id="flt-maxprice"
          type="range"
          min={0}
          max={1000}
          step={10}
          value={draft.maxPrice}
          onChange={(e) => setDraft((d) => ({ ...d, maxPrice: Number(e.target.value) }))}
          style={{ width: '100%', accentColor: 'var(--accent)' }}
        />
      </div>

      <div className="field">
        <label className="field__label">{t('catalog.min_rating')}</label>
        <div className="segmented">
          {[0, 3, 4].map((r) => (
            <button
              key={r}
              type="button"
              className={draft.rating === r ? 'is-active' : ''}
              onClick={() => { haptic('selection'); setDraft((d) => ({ ...d, rating: r })); }}
            >
              {r === 0 ? t('filter.all') : `${r}★+`}
            </button>
          ))}
        </div>
      </div>

      <div className="list-row" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
        <span className="list-row__text"><span className="list-row__title">{t('catalog.include_oos')}</span></span>
        <Switch checked={draft.outOfStock} onChange={(v) => setDraft((d) => ({ ...d, outOfStock: v }))} />
      </div>

      <button className="btn btn--block" onClick={() => onApply(draft)}>{t('catalog.apply_filters')}</button>
    </Sheet>
  );
}

function ProductGridCard({ product: p, onOpen }: { product: Product; onOpen: () => void }) {
  const discount = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
  return (
    <div className="product-card" onClick={onOpen} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }} role="link" tabIndex={0} aria-label={p.name}>
      <div className="product-image-container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="product-image" src={productArt(p)} alt={p.name} loading="lazy" />
        {discount > 0 && <div className="discount-badge">-{discount}%</div>}
        {p.type === 'digital' && <div className="digital-badge">{t('filter.digital')}</div>}
        {!p.inStock && <div className="out-of-stock-overlay">{t('stock.oos')}</div>}
      </div>
      <div className="product-info">
        <h3 className="product-name">{p.name}</h3>
        <div className="product-rating">
          <div className="rating-stars">{stars(p.rating)}</div>
          <span className="rating-text">{p.rating} ({p.reviewCount})</span>
        </div>
        <div className="product-price">
          <span className="current-price">{formatPrice(p.price)}</span>
          {p.originalPrice && <span className="original-price">{formatPrice(p.originalPrice)}</span>}
        </div>
        <div className="product-availability">
          {p.inStock ? <span className="in-stock">{t('stock.in')}</span> : <span className="out-of-stock">{t('stock.out')}</span>}
          {p.type === 'digital' && p.inStock ? <span className="instant-delivery">{t('stock.instant')}</span> : p.inStock ? <span className="stock-count">{t('stock.left', { count: p.stock })}</span> : null}
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="screen" style={{ padding: 24 }}>{t('app.loading')}</div>}>
      <CatalogInner />
    </Suspense>
  );
}
