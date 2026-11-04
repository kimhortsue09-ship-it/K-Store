'use client';
/** Shared product card — the real Nova Kit `.pcard` markup (grids across the storefront). */
import Link from 'next/link';
import { config } from '@/config';
import { useStore } from '@/lib/store';
import { formatPrice } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { productArt } from '@/lib/productArt';
import { t } from '@/lib/i18n';
import { Icon } from './Icon';
import type { Product } from '@/lib/types';

/**
 * @param selectable  Bulk-select mode (wishlist edit): the card no longer navigates — tapping it
 *                    calls `onSelect` and a `.fav-check` is overlaid on the media, exactly like the
 *                    HTML edition, which injects the check into this same card rather than
 *                    substituting a stripped-down one.
 */
export function ProductCard({ product: p, selectable = false, selected = false, onSelect }: {
  product: Product;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const { isWished, toggleWishlist } = useStore();
  const wished = isWished(p.id);
  const full = Math.round(p.rating);

  return (
    <Link
      className={`pcard${selectable && selected ? ' is-selected' : ''}`}
      href={`/product/${p.id}`}
      data-product={p.id}
      onClick={selectable ? (e) => { e.preventDefault(); onSelect?.(); } : undefined}
    >
      <div className="pcard__media">
        {selectable && <span className="fav-check">{selected ? <Icon name="check" size={14} /> : null}</span>}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={productArt(p)} alt={p.name} loading="lazy" width={600} height={600} />
        {p.badges[0] && <span className="pcard__badge">{p.badges[0]}</span>}
        {!p.inStock && <span className="pcard__oos">{t('product.out_of_stock')}</span>}
        <button
          className={`pcard__wish${wished ? ' is-wished' : ''}`}
          data-wish={p.id}
          aria-label="Wishlist"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (selectable) { onSelect?.(); return; }
            const now = toggleWishlist(p.id);
            haptic('selection');
            toast(now ? '❤️ Added to wishlist' : 'Removed from wishlist');
          }}
        >
          <Icon name="heart" size={18} filled={wished} />
        </button>
      </div>
      <div className="pcard__body">
        <div className="pcard__name">{p.name}</div>
        {config.features.ratings && (
          <span className="rating">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className={`star${i < full ? ' is-on' : ''}`}>
                <Icon name="star" size={13} filled={i < full} />
              </span>
            ))}
            <span className="rating__value">{p.rating.toFixed(1)}</span>
            <span className="rating__count">({p.reviewCount})</span>
          </span>
        )}
        <span className="price">
          <span className="price__now">{formatPrice(p.price)}</span>
          {p.originalPrice && <span className="price__was">{formatPrice(p.originalPrice)}</span>}
        </span>
      </div>
    </Link>
  );
}
