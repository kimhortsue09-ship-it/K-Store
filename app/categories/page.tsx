'use client';
/**
 * Categories — faithful port: type filter, a featured gradient grid, and the full category
 * list, each linking into the filtered catalog. Uses categories.css.
 */
import '../../styles/pages/categories.css';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { Icon } from '@/components/Icon';
import { TabBar } from '@/components/TabBar';
import { categoryArt } from '@/lib/productArt';

const TINTS = ['tint-blue', 'tint-green', 'tint-orange', 'tint-pink', 'tint-purple', 'tint-red'];
const GRADS = [
  'linear-gradient(135deg,#5B6CFF,#3B4BE0)',
  'linear-gradient(135deg,#00C853,#009e42)',
  'linear-gradient(135deg,#F59E0B,#d97706)',
  'linear-gradient(135deg,#EC4899,#be2765)',
];

export default function CategoriesPage() {
  const router = useRouter();
  const { categories, products } = useStore();
  const [type, setType] = useState('all');

  const list = categories.filter((c) => type === 'all' || c.type === type);
  const featured = categories.slice(0, 4);
  const catCount = (id: string) => products.filter((p) => p.categoryId === id).length;

  return (
    <>
      <header className="categories-header">
        <div className="header-top">
          <button className="back-button" aria-label="Back" onClick={() => router.push('/')}><Icon name="back" size={24} /></button>
          <div className="header-center"><h1 className="page-title">{t('home.categories')}</h1></div>
          <Link className="search-button" href="/search" aria-label="Search"><Icon name="search" size={22} /></Link>
        </div>
      </header>

      <main className="screen">
        <div className="categories-content">
          <div className="product-type-filter">
            {[['all', 'filter.all'], ['physical', 'filter.physical'], ['digital', 'filter.digital']].map(([id, label]) => (
              <button key={id} className={`type-button${type === id ? ' active' : ''}`} onClick={() => setType(id)}>{t(label)}</button>
            ))}
          </div>

          {type === 'all' && (
            <div className="featured-section">
              <h3 className="section-title">{t('home.featured')}</h3>
              <div className="featured-grid">
                {featured.map((c, i) => (
                  <Link key={c.id} className="featured-category" href={`/catalog?category=${c.id}`} style={{ background: GRADS[i % GRADS.length] }}>
                    <span className="featured-category__icon">{c.icon}</span>
                    <span>
                      <span className="featured-category__name">{c.name}</span>
                      <br />
                      <span className="featured-category__count">{catCount(c.id)} {t(catCount(c.id) === 1 ? 'unit.item' : 'unit.items')}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="categories-section">
            <h3 className="section-title">{t('categories.all')}</h3>
            <div className="categories-list">
              {list.map((c, i) => {
                const total = catCount(c.id);
                const tint = c.type === 'digital' ? 'tint-blue' : 'tint-green';
                return (
                  <Link key={c.id} className="category-card" href={`/catalog?category=${c.id}`}>
                    <span className={`category-image ${TINTS[i % TINTS.length]}`}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={categoryArt(c)} alt="" /></span>
                    <span className="category-info">
                      <span className="category-name">
                        {c.name}
                        <span className={`category-type ${tint}`}>{t(c.type === 'digital' ? 'filter.digital' : 'filter.physical')}</span>
                      </span>
                      <span className="category-count">{total} {t(total === 1 ? 'unit.product' : 'unit.products')} · {(c.subcategories ?? []).length} {t('unit.subcategories')}</span>
                    </span>
                    <span className="category-arrow">›</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <TabBar />
    </>
  );
}
