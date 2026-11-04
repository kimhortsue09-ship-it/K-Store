'use client';
/** Compare — faithful port: side-by-side product columns with removable cards. Uses features.css. */
import '../../styles/pages/features.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { usePersistentState } from '@/lib/usePersistentState';
import { COMPARE_KEY } from '@/lib/lists';
import { formatPrice } from '@/lib/format';
import { t } from '@/lib/i18n';
import { toast } from '@/lib/toast';
import { productArt } from '@/lib/productArt';
import { Icon } from '@/components/Icon';
import type { Product } from '@/lib/types';

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '—');

export default function ComparePage() {
  const router = useRouter();
  const { getProduct } = useStore();
  const [ids, setIds] = usePersistentState<string[]>(COMPARE_KEY, []);
  const items = ids.map(getProduct).filter(Boolean) as Product[];
  const rows: [string, (p: Product) => string][] = [
    ['Price', (p) => formatPrice(p.price)],
    ['Rating', (p) => `${p.rating} ★ (${p.reviewCount})`],
    ['Type', (p) => (p.type === 'digital' ? 'Digital' : 'Physical')],
    ['Category', (p) => cap(p.categoryId)],
    ['Availability', (p) => (p.inStock ? `${p.stock} in stock` : 'Out of stock')],
  ];

  return (
    <>
      <header className="page-header"><div className="header-top">
        <button className="hbtn" aria-label="Back" onClick={() => router.push('/catalog')}><Icon name="back" size={24} /></button>
        <div className="htitle"><h1>Compare</h1><span>{items.length} product{items.length === 1 ? '' : 's'}</span></div>
        {items.length ? <button className="hbtn" aria-label="Clear" onClick={() => setIds([])}><Icon name="trash" size={22} /></button> : <span style={{ width: 40 }} />}
      </div></header>

      <main className="screen">
        {items.length ? (
          <div className="feat-content"><div className="compare-scroll"><div className="compare-table">
            {items.map((p) => (
              <div key={p.id} className="compare-col">
                <Link className="compare-col__media" href={`/product/${p.id}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={productArt(p)} alt={p.name} />
                  <button className="compare-col__rm" aria-label="Remove" onClick={(e) => { e.preventDefault(); setIds(ids.filter((x) => x !== p.id)); toast('Removed'); }}>×</button>
                </Link>
                <div className="compare-cell"><span className="compare-cell__name">{p.name}</span></div>
                {rows.map(([label, fn]) => <div key={label} className="compare-cell"><span className="compare-cell__label">{label}</span><br />{fn(p)}</div>)}
                <div className="compare-cell"><Link className="btn btn--sm btn--block" href={`/product/${p.id}`}>View</Link></div>
              </div>
            ))}
          </div></div></div>
        ) : (
          <div className="empty-state" style={{ paddingTop: 60 }}><div className="empty-state__emoji">⚖️</div><h3>Nothing to compare</h3><p>Add products from their page to compare them side by side.</p><Link className="btn" href="/catalog">{t('nav.catalog')}</Link></div>
        )}
      </main>
    </>
  );
}
