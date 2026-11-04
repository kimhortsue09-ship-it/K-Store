'use client';
/**
 * Search — faithful port: an app-bar, a search field, recent + popular chips, and a live
 * .pcard result grid. Recent terms persist. Uses customer.css.
 */
import '../../styles/pages/customer.css';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { config } from '@/config';
import { useStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { Icon } from '@/components/Icon';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ProductCard } from '@/components/ProductCard';

const RECENT_KEY = `${config.data.persistNamespace}:recent-search`;
const SUGGESTIONS = ['Earbuds', 'Watch', 'Phone', 'Jacket', 'Game', 'E-book'];

export default function SearchPage() {
  const router = useRouter();
  const { products } = useStore();
  const [q, setQ] = useState('');
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      const r = localStorage.getItem(RECENT_KEY);
      if (r) setRecent(JSON.parse(r) as string[]);
    } catch {
      /* ignore */
    }
  }, []);

  const query = q.trim().toLowerCase();
  const found = query ? products.filter((p) => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)) : [];

  const saveRecent = (term: string) => {
    const tt = term.trim();
    if (!tt) return;
    const next = [tt, ...recent.filter((r) => r.toLowerCase() !== tt.toLowerCase())].slice(0, 6);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  /** The single entry point for a search — typing and chip taps both go through it, so a
   *  term picked from Recent/Popular is itself recorded as a recent search. */
  const run = (term: string) => { setQ(term); saveRecent(term); };

  return (
    <>
      <header className="appbar">
        <button className="appbar__btn" aria-label="Back" onClick={() => router.back()}><Icon name="back" size={22} /></button>
        <h1 className="appbar__title">{t('home.search_placeholder')}</h1>
        <div className="appbar__actions"><ThemeToggle /></div>
      </header>

      <main className="screen">
        <div className="search-field">
          <Icon name="search" size={20} />
          <input
            id="search-input"
            aria-label={t('home.search_placeholder')}
            value={q}
            onChange={(e) => run(e.target.value)}
            placeholder={t('home.search_placeholder')}
            autoComplete="off"
            autoFocus
          />
          <button aria-label={t('search.clear')} className="text-faint" onClick={() => setQ('')}><Icon name="close" size={18} /></button>
        </div>

        <div>
          {!query ? (
            <>
              {recent.length > 0 && (
                <>
                  <div className="section-head"><h2>{t('search.recent')}</h2></div>
                  <div className="search-tags">{recent.map((s) => <button key={s} className="chip" onClick={() => run(s)}>{s}</button>)}</div>
                </>
              )}
              <div className="section-head"><h2>{t('search.popular')}</h2></div>
              <div className="search-tags">{SUGGESTIONS.map((s) => <button key={s} className="chip" onClick={() => run(s)}>{s}</button>)}</div>
            </>
          ) : found.length ? (
            <>
              <div className="admin-section-title">{t('search.results', { count: found.length })}</div>
              <div className="pcard-grid">{found.map((p) => <ProductCard key={p.id} product={p} />)}</div>
            </>
          ) : (
            <div className="empty-state"><div className="empty-state__emoji">🔍</div><h3>{t('search.no_results', { q })}</h3></div>
          )}
        </div>
      </main>
    </>
  );
}
