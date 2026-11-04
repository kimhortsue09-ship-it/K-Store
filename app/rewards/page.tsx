'use client';
/** Rewards / Loyalty — faithful port: points + tier progress, redeem catalogue, ways to earn. Uses features.css. */
import '../../styles/pages/features.css';
import { useRouter } from 'next/navigation';
import { config } from '@/config';
import { usePersistentState } from '@/lib/usePersistentState';
import { formatNumber } from '@/lib/format';
import { haptic, tgConfirm } from '@/lib/telegram';
import { toast } from '@/lib/toast';
import { Icon } from '@/components/Icon';

const NS = config.data.persistNamespace;
const TIERS: [string, number][] = [['Bronze', 0], ['Silver', 1000], ['Gold', 2500], ['Platinum', 5000]];
const EARN = [
  { icon: '🛍️', title: 'Place an order', sub: 'Earn 1 point per $1 spent' },
  { icon: '⭐', title: 'Write a review', sub: '+50 points each' },
  { icon: '🎁', title: 'Refer a friend', sub: '+200 points when they order' },
  { icon: '🧑', title: 'Complete your profile', sub: '+100 points' },
];
const REDEEM = [
  { icon: '🏷️', title: '$5 off coupon', cost: 500 },
  { icon: '🏷️', title: '$10 off coupon', cost: 900 },
  { icon: '🚚', title: 'Free shipping', cost: 300 },
  { icon: '💳', title: '$20 store credit', cost: 1800 },
];

export default function RewardsPage() {
  const router = useRouter();
  const [points, setPoints] = usePersistentState<number>(`${NS}:points`, 1250);
  let cur: [string, number] = TIERS[0];
  let next: [string, number] | null = null;
  for (let i = 0; i < TIERS.length; i++) { if (points >= TIERS[i][1]) cur = TIERS[i]; else { next = TIERS[i]; break; } }
  const pct = next ? Math.round(((points - cur[1]) / (next[1] - cur[1])) * 100) : 100;

  const redeem = async (r: { title: string; cost: number }) => {
    if (points < r.cost) return;
    if (await tgConfirm(`Redeem ${formatNumber(r.cost)} points for ${r.title}?`)) { setPoints(points - r.cost); haptic('success'); toast(`Redeemed: ${r.title}`, { kind: 'success' }); }
  };

  return (
    <>
      <header className="page-header"><div className="header-top">
        <button className="hbtn" aria-label="Back" onClick={() => router.push('/profile')}><Icon name="back" size={24} /></button>
        <div className="htitle"><h1>Rewards</h1></div>
        <span style={{ width: 40 }} />
      </div></header>

      <main className="screen">
        <div className="rewards-hero">
          <div className="rewards-points">{formatNumber(points)}</div>
          <div className="rewards-tier">points · {cur[0]} member</div>
          <div className="tier-bar"><div className="tier-bar__fill" style={{ width: `${pct}%` }} /></div>
          <div className="muted text-sm">{next ? `${formatNumber(next[1] - points)} pts to ${next[0]}` : 'Top tier reached 🎉'}</div>
        </div>

        <div className="feat-content" style={{ paddingTop: 0 }}>
          <h3 className="section-title">Redeem</h3>
          <div className="stack gap-2">
            {REDEEM.map((r, i) => (
              <div key={i} className="reward-card">
                <span className="reward-card__icon">{r.icon}</span>
                <span className="grow"><span className="semibold">{r.title}</span><br /><span className="muted text-sm">{formatNumber(r.cost)} points</span></span>
                <button className={`btn btn--sm ${points >= r.cost ? '' : 'btn--outline'}`} disabled={points < r.cost} onClick={() => redeem(r)}>Redeem</button>
              </div>
            ))}
          </div>
          <h3 className="section-title">Ways to earn</h3>
          <div className="stack gap-2">
            {EARN.map((e, i) => (
              <div key={i} className="reward-card">
                <span className="reward-card__icon">{e.icon}</span>
                <span className="grow"><span className="semibold">{e.title}</span><br /><span className="muted text-sm">{e.sub}</span></span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
