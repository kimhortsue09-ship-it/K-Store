'use client';
/** Legal — faithful port: Terms / Privacy / Shipping segmented switcher (deep-linkable). Uses extra.css. */
import '../../styles/pages/extra.css';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { config } from '@/config';
import { Icon } from '@/components/Icon';

const brand = config.brand.name;
const DOCS: Record<string, { label: string; title: string; body: [string, string][] }> = {
  terms: {
    label: 'Terms', title: 'Terms & Conditions', body: [
      ['1. Overview', `These terms govern your use of ${brand} and any purchase made through it. By placing an order you agree to them.`],
      ['2. Orders & Pricing', 'All prices are shown in your selected currency and include applicable taxes where required. We may correct pricing errors and cancel affected orders.'],
      ['3. Digital Products', 'Licence keys and downloadable files are delivered instantly and are non-refundable once revealed or downloaded, except where required by law.'],
      ['4. Liability', `${brand} is not liable for indirect or consequential losses arising from use of the store, to the extent permitted by law.`],
    ],
  },
  privacy: {
    label: 'Privacy', title: 'Privacy Policy', body: [
      ['1. Data we collect', 'We collect the details you provide at checkout (name, contact, address) and basic usage data to operate the store.'],
      ['2. How we use it', 'Your data is used to fulfil orders, provide support, and — with your consent — send marketing you can opt out of at any time.'],
      ['3. Sharing', 'We share data only with processors needed to deliver your order (payment, shipping) and never sell it.'],
      ['4. Your rights', 'You may request access, correction, or deletion of your data from the Personal Information screen or by contacting support.'],
    ],
  },
  shipping: {
    label: 'Shipping & Returns', title: 'Shipping & Returns', body: [
      ['1. Delivery times', 'Physical orders ship within 1–2 business days. Standard delivery takes 5–7 days; express 2–3 days; overnight the next business day.'],
      ['2. Returns', 'Unused physical items may be returned within 30 days of delivery. Start a request from Profile → Returns.'],
      ['3. Refunds', 'Approved refunds are issued to your original payment method within 5–10 business days.'],
      ['4. Digital items', 'Digital purchases are non-returnable once the key is revealed or the file downloaded.'],
    ],
  },
};

function LegalInner() {
  const router = useRouter();
  const param = useSearchParams().get('doc');
  const [active, setActive] = useState(param && DOCS[param] ? param : 'terms');
  const d = DOCS[active];

  return (
    <>
      <header className="page-header"><div className="header-top">
        <button className="hbtn" aria-label="Back" onClick={() => router.push('/profile')}><Icon name="back" size={24} /></button>
        <div className="htitle"><h1>Legal</h1></div>
        <span style={{ width: 40 }} />
      </div></header>

      <main className="screen">
        <div className="extra-content">
          <div className="legal-tabs">{Object.entries(DOCS).map(([k, v]) => <button key={k} className={k === active ? 'active' : ''} onClick={() => setActive(k)}>{v.label}</button>)}</div>
          <h1 style={{ fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-bold)', marginBottom: 6 }}>{d.title}</h1>
          <div className="legal-updated">Last updated: 11 July 2026</div>
          <div className="legal-body">{d.body.map(([h, p]) => <div key={h}><h2>{h}</h2><p>{p}</p></div>)}</div>
        </div>
      </main>
    </>
  );
}

export default function LegalPage() {
  return (
    <Suspense fallback={<div className="screen" style={{ padding: 24 }}>Loading…</div>}>
      <LegalInner />
    </Suspense>
  );
}
