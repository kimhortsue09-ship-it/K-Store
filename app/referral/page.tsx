'use client';
/** Referral — faithful port: shareable code, share action, invited friends. Uses customer.css. */
import '../../styles/pages/customer.css';
import { useRouter } from 'next/navigation';
import { config } from '@/config';
import { haptic } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';
import { ThemeToggle } from '@/components/ThemeToggle';

const CODE = 'NOVA-7F3K';
const INVITED = [{ name: 'Amara O.', status: 'Joined' }, { name: 'Liam B.', status: 'Pending' }];

export default function ReferralPage() {
  const router = useRouter();
  const copy = async () => { try { await navigator.clipboard.writeText(CODE); } catch { /* ignore */ } haptic('success'); toast('Code copied', { kind: 'success' }); };
  const share = () => { const text = `Join ${config.brand.name} with my code ${CODE}!`; if (typeof navigator !== 'undefined' && navigator.share) navigator.share({ text }).catch(() => {}); else void copy(); };

  return (
    <>
      <header className="appbar">
        <button className="appbar__btn" aria-label="Back" onClick={() => router.push('/profile')}><Icon name="back" size={22} /></button>
        <h1 className="appbar__title">Invite friends</h1>
        <div className="appbar__actions"><ThemeToggle /></div>
      </header>

      <main className="screen">
        <div className="about" style={{ paddingBottom: 8 }}>
          <div className="about__logo">🎁</div>
          <h1 style={{ marginTop: 8 }}>Give $10, get $10</h1>
          <p className="muted">Share your code — you both get store credit on their first order.</p>
        </div>
        <div className="referral-code"><span>{CODE}</span><button className="btn btn--sm" onClick={copy}>Copy</button></div>
        <div className="container"><button className="btn btn--block" onClick={share}><Icon name="gift" size={18} /> Share invite</button></div>
        <div className="settings-group__label" style={{ paddingInline: 'var(--space-5)', marginTop: 'var(--space-2)' }}>Invited friends</div>
        <div className="list">
          {INVITED.map((f) => (
            <div key={f.name} className="list-row">
              <span className="invitee-avatar">{f.name.trim()[0] || '?'}</span>
              <span className="list-row__text"><span className="list-row__title">{f.name}</span><span className="list-row__sub">{f.status === 'Joined' ? 'Reward credited' : 'Awaiting first order'}</span></span>
              <span className={`status status--${f.status === 'Joined' ? 'delivered' : 'pending'}`}>{f.status}</span>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
