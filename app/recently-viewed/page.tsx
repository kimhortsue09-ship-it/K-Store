'use client';
/** Recently Viewed — faithful port: recorded products in the standard .pcard grid. */
import '../../styles/pages/features.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { usePersistentState } from '@/lib/usePersistentState';
import { RECENT_KEY } from '@/lib/lists';
import { t } from '@/lib/i18n';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { ProductCard } from '@/components/ProductCard';
import type { Product } from '@/lib/types';

export default function RecentlyViewedPage() {
  const router = useRouter();
  const { getProduct } = useStore();
  const [ids, setIds] = usePersistentState<string[]>(RECENT_KEY, []);
  const items = ids.map(getProduct).filter(Boolean) as Product[];

  return (
    <>
      <header className="page-header"><div className="header-top">
        <button className="hbtn" aria-label="Back" onClick={() => router.push('/profile')}><Icon name="back" size={24} /></button>
        <div className="htitle"><h1>Recently Viewed</h1><span>{items.length} item{items.length === 1 ? '' : 's'}</span></div>
        {items.length ? <button className="hbtn" aria-label="Clear" onClick={() => { setIds([]); toast('History cleared'); }}><Icon name="trash" size={22} /></button> : <span style={{ width: 40 }} />}
      </div></header>

      <main className="screen">
        {items.length ? (
          <div className="pcard-grid" style={{ paddingTop: 16 }}>{items.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        ) : (
          <div className="empty-state" style={{ paddingTop: 60 }}><div className="empty-state__emoji">👀</div><h3>Nothing viewed yet</h3><p>Products you open will show up here.</p><Link className="btn" href="/catalog">{t('nav.catalog')}</Link></div>
        )}
      </main>
    </>
  );
}
