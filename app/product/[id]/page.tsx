'use client';
/**
 * Product detail — faithful port: gallery + thumbnails, info, inline actions, quantity
 * selector, description, specs, "frequently bought together", reviews summary, related
 * products, and a fixed favourite + Add to Cart bar. Uses product.css.
 */
import '../../../styles/pages/product.css';
import '../../../styles/pages/reviews.css';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { config } from '@/config';
import { useStore } from '@/lib/store';
import { formatPrice } from '@/lib/format';
import { t } from '@/lib/i18n';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { productArt } from '@/lib/productArt';
import { recordRecent, addCompare } from '@/lib/lists';
import { Icon } from '@/components/Icon';
import { ProductCard } from '@/components/ProductCard';

const NS = config.data.persistNamespace;
function stars(rating: number) {
  const full = Math.round(rating);
  return [0, 1, 2, 3, 4].map((i) => <span key={i} className={`star${i < full ? ' filled' : ''}`}>★</span>);
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getProduct, getReviews, products, isWished, toggleWishlist, addToCart } = useStore();
  const product = getProduct(id);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [variant, setVariant] = useState<string | null>(null);

  useEffect(() => {
    if (!product) return;
    recordRecent(product.id);
    setVariant(product.variants?.[0]?.id ?? null); // preselect the first option, as the HTML kit does
  }, [product]);

  if (!product) {
    return (
      <>
        <header className="product-header"><div className="header-top">
          <button className="back-button" aria-label="Back" onClick={() => router.push('/catalog')}><Icon name="back" size={24} /></button>
          <div className="header-center"><h1 className="page-title">{t('product.title_short')}</h1></div>
          <span style={{ width: 40 }} />
        </div></header>
        <main className="screen"><div className="empty-state"><div className="empty-state__emoji">🧐</div><h3>{t('product.not_found')}</h3>
          <Link className="btn" href="/catalog">{t('nav.catalog')}</Link></div></main>
      </>
    );
  }

  // Real product photos (from gallery/image) when present; otherwise three re-lit illustration angles.
  const galleryImgs = (product.gallery ?? []).flatMap((g) => (g.kind === 'image' ? [g.src] : []));
  const shades = galleryImgs.length ? galleryImgs
    : product.image ? [product.image]
    : [0, 1, 2].map((v) => productArt(product, v));
  const reviewPreview = getReviews(product.id).slice(0, 1); // first real review, shown under the summary
  const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
  const wished = isWished(product.id);
  const related = products.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 4);
  const bundleExtra = related.find((p) => p.inStock) || null;
  const clampQty = (n: number) => setQty(Math.max(1, Math.min(config.commerce.maxQtyPerItem, n)));
  const catLabel = product.categoryId.charAt(0).toUpperCase() + product.categoryId.slice(1);
  const specRows: [string, string][] = [
    [t('spec.type'), product.type === 'digital' ? t('filter.digital') : t('filter.physical')],
    [t('spec.category'), catLabel],
    [t('spec.rating'), `${product.rating} / 5`],
    [t('spec.availability'), product.inStock ? t('stock.in_count', { count: product.stock }) : t('product.out_of_stock')],
  ];
  if (product.digital) {
    specRows.push([t('spec.platform'), product.digital.platform], [t('spec.format'), product.digital.format], [t('spec.license'), product.digital.license]);
  }

  const share = () => { if (typeof navigator !== 'undefined' && navigator.share) navigator.share({ title: product.name, text: product.name }).catch(() => {}); else toast('Link copied'); };
  const add = () => { addToCart(product, qty, variant ?? undefined); haptic('success'); toast('Added to cart', { kind: 'success' }); };
  const notify = () => { try { const k = `${NS}:stockAlerts`; const list = JSON.parse(localStorage.getItem(k) || '[]') as string[]; if (!list.includes(product.id)) list.push(product.id); localStorage.setItem(k, JSON.stringify(list)); } catch { /* ignore */ } haptic('success'); toast("We'll notify you when it's back in stock", { kind: 'success' }); };
  const compare = () => {
    const res = addCompare(product.id);
    if (res === 'exists') { toast('Already in compare'); return; }
    if (res === 'full') { toast('Compare is full (max 4)', { kind: 'danger' }); return; }
    haptic('success'); toast('Added to compare — open it from any product', { kind: 'success' });
  };
  const fav = () => {
    const now = toggleWishlist(product.id);
    haptic(now ? 'success' : 'light');
    toast(now ? '❤️ Added to wishlist' : 'Removed from wishlist');
  };
  const addBundle = () => { [product, bundleExtra].forEach((p) => p && addToCart(p)); haptic('success'); toast('Bundle added to cart', { kind: 'success' }); };
  const selectVariant = (vid: string) => { setVariant(vid); haptic('selection'); };

  return (
    <>
      <header className="product-header"><div className="header-top">
        <button className="back-button" aria-label="Back" onClick={() => router.push('/catalog')}><Icon name="back" size={24} /></button>
        <div className="header-center"><h1 className="page-title">{t('product.title')}</h1></div>
        <button className="share-button" aria-label={t('product.share')} onClick={share}><Icon name="send" size={22} /></button>
      </div></header>

      <main className="screen">
        <div className="product-content">
          <div className="product-images-section">
            <div className="main-image-container">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="main-image" src={shades[activeImg]} alt={product.name} />
              <div className="image-indicators">{shades.map((_, i) => <span key={i} role="button" tabIndex={0} aria-label={t('product.select_image', { n: i + 1 })} className={`indicator${i === activeImg ? ' active' : ''}`} onClick={() => setActiveImg(i)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveImg(i); } }} />)}</div>
            </div>
            <div className="thumbnail-images">
              {shades.map((s, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} className={`thumbnail${i === activeImg ? ' active' : ''}`} src={s} alt={`thumb ${i + 1}`} role="button" tabIndex={0} aria-label={t('product.select_image', { n: i + 1 })} onClick={() => setActiveImg(i)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveImg(i); } }} />
              ))}
            </div>
          </div>

          <div className="product-info-section">
            <div className={`product-type-badge ${product.type}`}>{t(product.type === 'digital' ? 'cart.digital_product' : 'cart.physical_product')}</div>
            <h1 className="product-name">{product.name}</h1>
            <div className="product-rating"><div className="rating-stars">{stars(product.rating)}</div><span className="rating-text">{product.rating} ({t('product.reviews', { count: product.reviewCount })})</span></div>
            <div className="product-price">
              <span className="current-price">{formatPrice(product.price)}</span>
              {product.originalPrice && <><span className="original-price">{formatPrice(product.originalPrice)}</span><span className="discount-badge">{t('product.off', { discount })}</span></>}
            </div>
            <div className="product-availability">
              {product.inStock ? <span className="availability-status in-stock">{t('stock.in')}</span> : <span className="availability-status out-of-stock">{t('stock.out')}</span>}
              {product.inStock && <span className="stock-count">{t('stock.items_left', { count: product.stock })}</span>}
            </div>
            <div className="product-inline-actions">
              <Link className="chip" href={`/product/${product.id}/qa`}>❓ Q&amp;A</Link>
              <button className="chip" onClick={compare}>⚖️ {t('product.compare')}</button>
              <button className="chip" onClick={share}><Icon name="send" size={14} /> {t('product.share')}</button>
            </div>
          </div>

          <div className="purchase-options-section">
            {product.variants && product.variants.length > 0 && (
              <div className="product-options-section">
                <h4 className="option-title">{t('product.options')}</h4>
                <div className="variant-chips">
                  {product.variants.map((v) => (
                    <button key={v.id} className={`variant-chip${v.id === variant ? ' active' : ''}`} onClick={() => selectVariant(v.id)}>{v.label}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="custom-quantity-section">
              <h4 className="option-title" id="qty-label">{t('product.quantity')}</h4>
              <div className="quantity-input-container">
                <button className="quantity-btn-large" aria-label="−" onClick={() => clampQty(qty - 1)}>−</button>
                <input type="number" className="quantity-input" aria-labelledby="qty-label" value={qty} min={1} onChange={(e) => clampQty(parseInt(e.target.value, 10) || 1)} />
                <button className="quantity-btn-large" aria-label="+" onClick={() => clampQty(qty + 1)}>+</button>
              </div>
              <div className="quantity-price-display">
                <span className="unit-price">{t('product.unit_price')}: {formatPrice(product.price)}</span>
                <span className="total-price">{t('cart.total')}: {formatPrice(product.price * qty)}</span>
              </div>
            </div>
          </div>

          <div className="product-description-section"><h3 className="section-title">{t('product.description')}</h3>
            <div className="description-content"><p>{product.description}</p></div></div>

          <div className="product-specs-section"><h3 className="section-title">{t('product.specifications')}</h3>
            <div className="specs-list">{specRows.map(([l, v]) => <div key={l} className="spec-item"><span className="spec-label">{l}</span><span className="spec-value">{v}</span></div>)}</div></div>

          {bundleExtra && (
            <div className="product-specs-section"><h3 className="section-title">{t('product.bought_together')}</h3>
              <div className="bundle">
                <Link className="bundle__item" href={`/product/${product.id}`}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={productArt(product)} alt="" /><span className="bundle__name">{product.name}</span><span className="semibold">{formatPrice(product.price)}</span></Link>
                <span className="bundle__plus">+</span>
                <Link className="bundle__item" href={`/product/${bundleExtra.id}`}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={productArt(bundleExtra)} alt="" /><span className="bundle__name">{bundleExtra.name}</span><span className="semibold">{formatPrice(bundleExtra.price)}</span></Link>
              </div>
              <button className="btn btn--block" style={{ marginTop: 12 }} onClick={addBundle}>{t('product.add_both', { price: formatPrice(product.price + bundleExtra.price) })}</button>
            </div>
          )}

          {config.features.reviews && (
            <div className="reviews-section">
              <div className="reviews-header"><h3 className="section-title" style={{ margin: 0 }}>{t('product.customer_reviews')}</h3>
                <Link className="see-all" href={`/product/${product.id}/reviews`}>{t('action.see_all')} ›</Link></div>
              <div className="rev-summary">
                <div style={{ textAlign: 'center' }}><div className="rev-summary__num">{product.rating.toFixed(1)}</div><div className="rev-summary__stars">{stars(product.rating)}</div></div>
                <div className="rev-summary__count">{t('product.reviews', { count: product.reviewCount })}<br /><Link className="see-all" href={`/product/${product.id}/reviews`}>{t('product.write_review')}</Link></div>
              </div>
              {reviewPreview.map((r) => (
                <div key={r.id} className="review-item">
                  <div className="review-header"><div className="reviewer-info"><span className="reviewer-name">{r.author}</span><div className="review-rating">{stars(r.rating)}</div></div></div>
                  <div className="review-comment">{r.body}</div>
                </div>
              ))}
            </div>
          )}

          {related.length > 0 && (
            <div className="related-products-section"><h3 className="section-title">{t('product.related')}</h3>
              <div className="related-products-grid">{related.map((p) => <ProductCard key={p.id} product={p} />)}</div></div>
          )}
        </div>
      </main>

      <div className="bottom-action-bar">
        <button className={`favorite-btn${wished ? ' is-wished' : ''}`} aria-label="Wishlist" onClick={fav}><Icon name="heart" size={24} filled={wished} /></button>
        <div className="cart-summary"><div className="cart-quantity">{t('product.qty', { count: qty })}</div><div className="cart-total">{formatPrice(product.price * qty)}</div></div>
        {product.inStock
          ? <button className="add-to-cart-btn" onClick={add}><Icon name="cart" size={20} /> {t('product.add_to_cart_full')}</button>
          : <button className="add-to-cart-btn" onClick={notify}><Icon name="bell" size={20} /> {t('product.notify_me')}</button>}
      </div>
    </>
  );
}
