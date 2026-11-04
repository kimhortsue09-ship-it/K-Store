'use client';
/** Onboarding — faithful port: swipeable intro carousel with dots. Uses customer.css. */
import '../../styles/pages/customer.css';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { config } from '@/config';
import { haptic } from '@/lib/telegram';

const SLIDES = [
  { emoji: '🛍️', title: `Welcome to ${config.brand.name}`, text: config.brand.tagline },
  { emoji: '⚡', title: 'Shop in a tap', text: 'Browse, add to cart, and check out without ever leaving your chat.' },
  { emoji: '🔒', title: 'Fast & secure', text: 'Multiple payment options with instant delivery for digital goods.' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const finish = () => { try { localStorage.setItem(`${config.data.persistNamespace}:onboarded`, '1'); } catch { /* ignore */ } router.push('/'); };
  const onScroll = () => { const tr = trackRef.current; if (tr) setIndex(Math.round(tr.scrollLeft / tr.clientWidth)); };
  const next = () => {
    const tr = trackRef.current;
    if (index < SLIDES.length - 1 && tr) { tr.scrollTo({ left: (index + 1) * tr.clientWidth, behavior: 'smooth' }); haptic('selection'); }
    else finish();
  };

  return (
    <main className="screen">
      <div className="onb">
        <div className="onb__track" ref={trackRef} onScroll={onScroll}>
          {SLIDES.map((s, i) => (
            <div key={i} className="onb__slide"><div className="onb__emoji">{s.emoji}</div><h2>{s.title}</h2><p>{s.text}</p></div>
          ))}
        </div>
        <div className="onb__foot">
          <div className="onb__dots">{SLIDES.map((_, i) => <span key={i} className={`onb__dot${i === index ? ' is-on' : ''}`} />)}</div>
          <button className="btn btn--block" onClick={next}>{index === SLIDES.length - 1 ? 'Get started' : 'Next'}</button>
          <button className="btn btn--outline btn--block" onClick={finish}>Skip</button>
        </div>
      </div>
    </main>
  );
}
