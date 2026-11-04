'use client';
/**
 * Nova Kit — Components showcase
 * A living style guide that renders every core component in the active theme, so buyers can
 * see the whole system (and test the Black/White toggle) at a glance.
 * Faithful port of the HTML kit's `components.html` + `assets/js/pages/components.js`.
 */
import '../../styles/pages/customer.css';
import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { Switch } from '@/components/Switch';
import { ThemeToggle } from '@/components/ThemeToggle';
import { formatPrice } from '@/lib/format';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';

/** `block(title, body)` from the HTML controller. */
function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="showcase-block">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

/** `ratingStars(rating, count)` from assets/js/components.js. */
function RatingStars({ rating, count }: { rating: number; count?: number }) {
  const full = Math.round(rating);
  return (
    <span className="rating">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={`star${i < full ? ' is-on' : ''}`}>
          <Icon name="star" size={13} filled={i < full} />
        </span>
      ))}
      <span className="rating__value">{rating.toFixed(1)}</span>
      {count != null && <span className="rating__count">({count})</span>}
    </span>
  );
}

/** `priceTag(price, compareAt)` from assets/js/components.js. */
function PriceTag({ price, compareAt }: { price: number; compareAt?: number }) {
  return (
    <span className="price">
      <span className="price__now">{formatPrice(price)}</span>
      {compareAt ? <span className="price__was">{formatPrice(compareAt)}</span> : null}
    </span>
  );
}

const SEGMENTS = ['One', 'Two', 'Three'] as const;

export default function ComponentsPage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [option, setOption] = useState('Option A');
  const [switched, setSwitched] = useState(true);
  const [segment, setSegment] = useState<string>('One');
  const [qty, setQty] = useState(2);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <header className="appbar">
        <button className="appbar__btn" aria-label="Back" onClick={() => router.push('/')}>
          <Icon name="back" size={22} />
        </button>
        <h1 className="appbar__title">Components</h1>
        <div className="appbar__actions"><ThemeToggle /></div>
      </header>

      <main className="screen screen--no-tabbar">
        <Block title="Buttons">
          <div className="showcase-row">
            <button className="btn">Primary</button>
            <button className="btn btn--ghost">Ghost</button>
            <button className="btn btn--outline">Outline</button>
            <button className="btn btn--sm">Small</button>
            <button className="btn" disabled>Disabled</button>
          </div>
        </Block>

        <Block title="Chips">
          <div className="showcase-row">
            <span className="chip is-active">Active</span>
            <span className="chip">Default</span>
            <span className="chip"><Icon name="star" size={14} filled /> Rated</span>
          </div>
        </Block>

        <Block title="Badges &amp; status">
          <div className="showcase-row">
            <span className="status status--pending">Pending</span>
            <span className="status status--paid">Paid</span>
            <span className="status status--shipped">Shipped</span>
            <span className="status status--delivered">Delivered</span>
            <span className="status status--cancelled">Cancelled</span>
          </div>
        </Block>

        <Block title="Rating &amp; price">
          <div className="showcase-row" style={{ gap: 20 }}>
            <RatingStars rating={4.5} count={128} />
            <PriceTag price={89} compareAt={119} />
          </div>
        </Block>

        <Block title="Form controls">
          <div className="field">
            <label className="field__label" htmlFor="showcase-input">Text input</label>
            <input
              id="showcase-input"
              className="input"
              placeholder="Type here"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="showcase-select">Select</label>
            <select
              id="showcase-select"
              className="select"
              value={option}
              onChange={(e) => setOption(e.target.value)}
            >
              <option>Option A</option>
              <option>Option B</option>
            </select>
          </div>
          <div className="row-between">
            <span>Switch</span>
            <Switch checked={switched} onChange={setSwitched} />
          </div>
          <div className="segmented" style={{ marginTop: 12 }}>
            {SEGMENTS.map((s) => (
              <button
                key={s}
                className={segment === s ? 'is-active' : undefined}
                onClick={() => { haptic('selection'); setSegment(s); }}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <div className="stepper">
              <button aria-label="Decrease" onClick={() => { haptic('selection'); setQty((q) => Math.max(1, q - 1)); }}>
                <Icon name="minus" size={16} />
              </button>
              <span className="stepper__value">{qty}</span>
              <button aria-label="Increase" onClick={() => { haptic('selection'); setQty((q) => q + 1); }}>
                <Icon name="plus" size={16} />
              </button>
            </div>
          </div>
        </Block>

        <Block title="List rows">
          <div className="list" style={{ margin: 0 }}>
            <div className="list-row">
              <span className="list-row__icon"><Icon name="bag" size={20} /></span>
              <span className="list-row__text">
                <span className="list-row__title">List item</span>
                <span className="list-row__sub">With subtitle</span>
              </span>
              <Icon name="chevron" size={18} className="text-faint" />
            </div>
          </div>
        </Block>

        <Block title="Overlays">
          <div className="showcase-row">
            <button
              className="btn btn--ghost"
              onClick={() => { haptic('success'); toast('This is a toast', { kind: 'success' }); }}
            >
              Show toast
            </button>
            <button className="btn btn--ghost" onClick={() => setSheetOpen(true)}>Open sheet</button>
          </div>
        </Block>

        <Block title="Skeleton">
          <div className="skeleton" style={{ height: 56, borderRadius: 12 }} />
        </Block>
      </main>

      {sheetOpen && (
        <Sheet title="Bottom sheet" onClose={() => setSheetOpen(false)}>
          <p className="muted">Sheets slide up for pickers, forms, and confirmations.</p>
        </Sheet>
      )}
    </>
  );
}
