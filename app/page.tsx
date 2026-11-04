'use client';
/**
 * Home — storefront dashboard. Mirrors the HTML edition's exact markup + home.css so it
 * renders identically: brand header + segmented pill, big balance, quick-action grid,
 * colour-accented category cards and trending sparkline cards.
 */
import '../styles/pages/home.css';
import Link from 'next/link';
import { config } from '@/config';
import { useStore } from '@/lib/store';
import { formatPrice } from '@/lib/format';
import { t } from '@/lib/i18n';
import { closeApp } from '@/lib/telegram';
import { Icon } from '@/components/Icon';
import { ThemeToggle } from '@/components/ThemeToggle';
import { TabBar } from '@/components/TabBar';
import { productArt, categoryArt } from '@/lib/productArt';

const SPARKS = [
  'M5,25 Q15,15 25,18 T45,8 T55,12',
  'M5,20 Q15,10 25,15 T45,5 T55,8',
  'M5,22 Q15,12 25,16 T45,6 T55,10',
  'M5,18 Q15,8 25,12 T45,4 T55,7',
];
const TINTS = ['tint-blue', 'tint-green', 'tint-orange', 'tint-pink', 'tint-purple', 'tint-red'];
const ACTIONS: { icon: string; href: string; label?: string; labelKey?: string }[] = [
  { icon: 'bag', labelKey: 'orders.title', href: '/orders' },
  { icon: 'tag', label: 'Deals', href: '/deals' },
  { icon: 'heart', labelKey: 'nav.wishlist', href: '/wishlist' },
  { icon: 'card', label: 'Wallet', href: '/wallet' },
];

export default function HomePage() {
  const { products, categories, cartCount } = useStore();
  const featured = products.filter((p) => p.badges.includes('Bestseller'));
  const trending = [...featured, ...products.filter((p) => !featured.includes(p))].slice(0, 4);
  const hero = featured[0] ?? products[0];
  const heroOff = hero?.originalPrice
    ? Math.round((1 - hero.price / hero.originalPrice) * 100) : 0;

  return (
    <>
      <div className="home-header">
        <div className="hh-top">
          <button className="hh-close" onClick={() => closeApp()}>Close</button>
          <div className="hh-center">
            <span className="hh-title">{config.brand.shortName} {config.brand.logoEmoji}</span>
            <span className="hh-sub">mini app</span>
          </div>
          <Link className="appbar__btn" href="/cart" aria-label="Cart">
            <Icon name="cart" size={22} />
            {cartCount > 0 && <span className="appbar__badge">{cartCount}</span>}
          </Link>
        </div>
        <div className="hh-content">
          <span className="hh-avatar">{config.brand.logoEmoji}</span>
          <div className="pill">
            <Link className="is-active" href="/">{t('nav.catalog')}</Link>
            <Link href="/categories">{t('home.categories')}</Link>
          </div>
          <span className="hh-slot">
            {config.theme.allowUserToggle ? (
              <ThemeToggle />
            ) : (
              <Link className="appbar__btn" href="/search" aria-label="Search"><Icon name="search" size={22} /></Link>
            )}
          </span>
        </div>
      </div>

      <main className="screen">
        {hero && (
          <Link className="home-hero" href={`/product/${hero.id}`}>
            <div className="home-hero__text">
              <span className="home-hero__eyebrow">{t('home.trending')}</span>
              <span className="home-hero__title">{hero.name}</span>
              <span className="home-hero__price">
                {formatPrice(hero.price)}
                {heroOff > 0 && <span className="home-hero__off">-{heroOff}%</span>}
              </span>
              <span className="home-hero__cta">{t('action.see_all')} <Icon name="chevron" size={16} /></span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="home-hero__art" src={productArt(hero)} alt={hero.name} />
          </Link>
        )}

        <div className="action-grid">
          {ACTIONS.map((a) => (
            <Link key={a.href} className="action-item" href={a.href}>
              <span className="action-item__icon"><Icon name={a.icon} size={24} /></span>
              <span className="action-item__label">{a.labelKey ? t(a.labelKey) : a.label}</span>
            </Link>
          ))}
        </div>

        {config.features.categories && (
          <div className="home-section">
            <div className="home-section__head">
              <span className="home-section__title">{t('home.categories')}</span>
              <Link className="home-section__more" href="/categories">{t('action.see_all')}</Link>
            </div>
            <div className="cat-cards">
              {categories.map((c, i) => {
                const total = products.filter((p) => p.categoryId === c.id).length;
                const sub = (c.subcategories ?? []).map((s) => s.name).slice(0, 3).join(', ');
                const isDigital = c.type === 'digital';
                return (
                  <Link key={c.id} className="cat-card" href={`/catalog?category=${c.id}`}>
                    <span className={`cat-card__icon ${TINTS[i % TINTS.length]}`}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={categoryArt(c)} alt="" /></span>
                    <span className="cat-card__body">
                      <span className="cat-card__title">
                        {c.name}
                        <span className={`indicator ${isDigital ? 'tint-blue' : 'tint-green'}`}>{isDigital ? '💾 Digital' : '📦 Physical'}</span>
                      </span>
                      <span className="cat-card__sub">{sub}</span>
                      <span className="cat-card__stats">
                        <span>{total} {total === 1 ? 'product' : 'products'}</span>
                        <span>{(c.subcategories ?? []).length} subcategories</span>
                      </span>
                    </span>
                    <span className="cat-card__arrow">›</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="home-section">
          <div className="home-section__head">
            <span className="home-section__title">{t('home.trending')}</span>
            <Link className="home-section__more" href="/catalog">{t('action.see_all')}</Link>
          </div>
          <div className="trend-grid">
            {trending.map((p, i) => {
              const change = (6 + ((i * 37) % 12) + 0.6).toFixed(1);
              return (
                <Link key={p.id} className="trend-card" href={`/product/${p.id}`}>
                  <span className="trend-card__icon">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={productArt(p)} alt={p.name} /></span>
                  <svg className="trend-card__spark" width="60" height="30" viewBox="0 0 60 30"><path d={SPARKS[i % SPARKS.length]} /></svg>
                  <div className="trend-card__name">{p.name.split(' ')[0]}</div>
                  <div className="trend-card__change">↑ {change}%</div>
                  <div className="trend-card__price">{formatPrice(p.price)}</div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      <TabBar />
    </>
  );
}
