'use client';
/**
 * Profile — faithful port: avatar + chooser sheet (upload / emoji / remove), verified name,
 * wallet badge, 3 stats, sectioned option lists with tinted icons, notifications toggle and
 * sign-out. Uses profile.css.
 */
import '../../styles/pages/profile.css';
import Link from 'next/link';
import { useRef, useState, type ReactNode } from 'react';
import { config } from '@/config';
import { t } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { usePersistentState } from '@/lib/usePersistentState';
import { useTransactions } from '@/lib/wallet';
import { formatPrice } from '@/lib/format';
import { toast } from '@/lib/toast';
import { telegramUser, tgConfirm, isTelegram, closeApp, haptic } from '@/lib/telegram';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { ThemeToggle } from '@/components/ThemeToggle';
import { TabBar } from '@/components/TabBar';

const NS = config.data.persistNamespace;
const TINTS = ['tint-blue', 'tint-green', 'tint-orange', 'tint-pink', 'tint-purple', 'tint-red'];
const MAX_AVATAR = 2 * 1024 * 1024;
const EMOJIS = ['🛍️', '😀', '😎', '🧑', '👩', '👨', '🦊', '🐼', '🐨', '🚀', '⭐', '🔥', '🎧', '🎮', '📚', '☕'];
type Avatar = { type: 'image' | 'emoji'; value: string } | null;

export default function ProfilePage() {
  const { orders, wishlist, addresses } = useStore();
  const [avatar, setAvatar] = usePersistentState<Avatar>(`${NS}:avatar`, null);
  const [profile] = usePersistentState<{ firstName?: string; lastName?: string; email?: string }>(`${NS}:profile`, {});
  const [prefs, setPrefs] = usePersistentState<{ notifications?: boolean }>(`${NS}:prefs`, {});
  const { balance } = useTransactions();
  const [sheet, setSheet] = useState<'photo' | 'emoji' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const tgu = telegramUser();

  const savedName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
  const name = savedName || (tgu ? [tgu.first_name, tgu.last_name].filter(Boolean).join(' ') : 'Guest User');
  const verified = Boolean(tgu);
  const handle = tgu?.username ? '@' + tgu.username : '';
  const email = profile.email || handle || '';
  const complete = Boolean(savedName || email); // has the shopper filled in details?

  let ti = 0;
  const tint = () => TINTS[ti++ % TINTS.length];

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast('Please choose an image file', { kind: 'danger' });
    if (file.size > MAX_AVATAR) return toast('Image must be under 2 MB', { kind: 'danger' });
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar({ type: 'image', value: String(reader.result) });
      haptic('success');
      toast('Photo updated', { kind: 'success' });
    };
    reader.readAsDataURL(file);
  };

  const pickEmoji = (e: string) => {
    setAvatar({ type: 'emoji', value: e });
    haptic('success');
    setSheet(null);
    toast('Avatar updated', { kind: 'success' });
  };

  const removePhoto = () => {
    setAvatar(null);
    setSheet(null);
    haptic('medium');
    toast('Photo removed');
  };

  const toggleNotifications = (on: boolean) => {
    setPrefs((p) => ({ ...p, notifications: on }));
    toast(`Notifications ${on ? 'on' : 'off'}`);
  };

  const signOut = async () => {
    if (await tgConfirm(t('profile.sign_out_confirm'))) {
      haptic('medium');
      if (isTelegram()) closeApp();
      else toast('Signed out (demo)');
    }
  };

  return (
    <>
      <header className="profile-header"><div className="header-top">
        <span style={{ width: 40 }} />
        <div className="header-center"><h1 className="page-title">{t('profile.title')}</h1><span className="profile-subtitle">{t('profile.subtitle')}</span></div>
        {config.theme.allowUserToggle ? <ThemeToggle /> : <span style={{ width: 40 }} />}
      </div></header>

      <main className="screen">
        <div className="profile-content">
          <div className="profile-info-section">
            <div className="profile-avatar">
              <div className={`avatar-image${avatar?.type === 'image' ? ' has-photo' : ''}`}>
                {avatar?.type === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="avatar-photo" src={avatar.value} alt={t('profile.photo_title')} />
                ) : (
                  <div className="avatar-placeholder">{avatar?.value || config.brand.logoEmoji}</div>
                )}
              </div>
              <button className="change-avatar-btn" aria-label={t('profile.change_photo')} onClick={() => setSheet('photo')}><Icon name="image" size={16} /></button>
            </div>
            <div className="profile-name">{name}{verified && <span className="profile-verified" title={t('profile.verified')}><Icon name="check" size={16} /></span>}</div>
            {complete ? (
              <div className="profile-email">{email || 'Nova member'}</div>
            ) : (
              <Link className="profile-email profile-email--action" href="/personal-info">{t('profile.complete')}</Link>
            )}
            <div className="profile-badges">
              <span className="profile-badge">✨ Nova Member</span>
              <Link className="profile-badge profile-badge--link" href="/wallet">💳 {formatPrice(balance)}</Link>
            </div>
            <div className="profile-stats">
              <Link className="stat-item" href="/orders"><div className="stat-value">{orders.length}</div><div className="stat-label">{t('orders.title')}</div></Link>
              <Link className="stat-item" href="/wishlist"><div className="stat-value">{wishlist.length}</div><div className="stat-label">{t('profile.favorites')}</div></Link>
              <Link className="stat-item" href="/addresses"><div className="stat-value">{addresses.length}</div><div className="stat-label">{t('profile.addresses')}</div></Link>
            </div>
          </div>

          <input ref={fileRef} type="file" accept="image/*" aria-label={t('profile.change_photo')} hidden onChange={onFile} />

          <div className="profile-options">
            <Section title={t('profile.sec_account')}>
              <Item icon="bag" tint={tint()} title={t('profile.item_order_history')} subtitle={t('profile.item_order_history_sub')} href="/orders" badge={orders.length} />
              <Item icon="download" tint={tint()} title={t('profile.item_downloads')} subtitle={t('profile.item_downloads_sub')} href="/downloads" />
              <Item icon="heart" tint={tint()} title={t('profile.item_favorites')} subtitle={t('profile.item_favorites_sub')} href="/wishlist" badge={wishlist.length} />
              <Item icon="box" tint={tint()} title={t('profile.item_returns')} subtitle={t('profile.item_returns_sub')} href="/returns" />
              {config.features.addresses && <Item icon="map" tint={tint()} title={t('profile.item_address_book')} subtitle={t('profile.item_address_book_sub')} href="/addresses" badge={addresses.length} />}
              {config.features.paymentMethods && <Item icon="card" tint={tint()} title={t('profile.item_payment')} subtitle={t('profile.item_payment_sub')} href="/payment-methods" />}
              {config.features.promo && <Item icon="tag" tint={tint()} title={t('profile.item_coupons')} subtitle={t('profile.item_coupons_sub')} href="/coupons" />}
            </Section>

            <Section title={t('profile.sec_rewards')}>
              <Item icon="card" tint={tint()} title={t('profile.item_wallet')} subtitle={t('profile.item_wallet_sub')} href="/wallet" />
              <Item icon="star" tint={tint()} title={t('profile.item_rewards')} subtitle={t('profile.item_rewards_sub')} href="/rewards" />
              <Item icon="gift" tint={tint()} title={t('profile.item_gift')} subtitle={t('profile.item_gift_sub')} href="/gift-cards" />
              <Item icon="clock" tint={tint()} title={t('profile.item_recent')} subtitle={t('profile.item_recent_sub')} href="/recently-viewed" />
              <Item icon="gift" tint={tint()} title={t('profile.item_invite')} subtitle={t('profile.item_invite_sub')} href="/referral" />
            </Section>

            <Section title={t('profile.sec_settings')}>
              <Item icon="user" tint={tint()} title={t('profile.item_personal')} subtitle={t('profile.item_personal_sub')} href="/personal-info" />
              <Item icon="gear" tint={tint()} title={t('profile.settings')} subtitle={t('profile.item_settings_sub')} href="/settings" />
              {config.features.languageSwitcher && <Item icon="globe" tint={tint()} title={t('profile.language')} subtitle={t('profile.item_language_sub')} href="/language" />}
            </Section>

            <Section title={t('profile.sec_preferences')}>
              {config.features.notifications && (
                <Item icon="bell" tint={tint()} title={t('profile.item_notifications')} subtitle={t('profile.item_notifications_sub')} toggle checked={prefs.notifications !== false} onToggle={toggleNotifications} />
              )}
              <Item icon="info" tint={tint()} title={t('profile.item_privacy')} subtitle={t('profile.item_privacy_sub')} href="/legal?doc=privacy" />
            </Section>

            <Section title={t('profile.sec_support')}>
              <Item icon="help" tint={tint()} title={t('profile.item_help')} subtitle={t('profile.item_help_sub')} href="/help" />
              <Item icon="send" tint={tint()} title={t('profile.item_support')} subtitle={t('profile.item_support_sub')} href="/support" />
              <Item icon="info" tint={tint()} title={t('profile.item_legal')} subtitle={t('profile.item_legal_sub')} href="/legal" />
              <Item icon="info" tint={tint()} title={t('profile.about')} subtitle={t('profile.item_about_sub', { brand: config.brand.name })} href="/about" />
              {config.features.admin && <Item icon="box" tint={tint()} title={t('profile.item_admin')} subtitle={t('profile.item_admin_sub')} href="/admin" />}
            </Section>

            <div className="logout-section"><button className="logout-btn" onClick={signOut}><Icon name="logout" size={22} /> {t('profile.sign_out')}</button></div>
          </div>
        </div>
      </main>

      {sheet === 'photo' && (
        <Sheet title={t('profile.photo_title')} onClose={() => setSheet(null)}>
          <div className="stack gap-3">
            <button className="btn btn--block" onClick={() => { setSheet(null); fileRef.current?.click(); }}><Icon name="upload" size={18} /> {t('profile.upload_photo')}</button>
            <button className="btn btn--outline btn--block" onClick={() => setSheet('emoji')}><Icon name="image" size={18} /> {t('profile.choose_emoji')}</button>
            {avatar && (
              <button className="btn btn--outline btn--block" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={removePhoto}>{t('profile.remove_photo')}</button>
            )}
            <p className="muted text-sm" style={{ textAlign: 'center' }}>{t('profile.photo_hint')}</p>
          </div>
        </Sheet>
      )}

      {sheet === 'emoji' && (
        <Sheet title={t('profile.choose_emoji')} onClose={() => setSheet(null)}>
          <div className="emoji-picker">
            {EMOJIS.map((e) => <button key={e} onClick={() => pickEmoji(e)}>{e}</button>)}
          </div>
        </Sheet>
      )}

      <TabBar />
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <div className="option-section"><h3 className="section-title">{title}</h3><div className="options-list">{children}</div></div>;
}

function Item({ icon: ic, tint, title, subtitle, href, badge, toggle, checked, onToggle }: {
  icon: string; tint: string; title: string; subtitle: string; href?: string; badge?: number; toggle?: boolean; checked?: boolean; onToggle?: (v: boolean) => void;
}) {
  const right = toggle ? (
    <label className="switch"><input type="checkbox" checked={checked} onChange={(e) => onToggle?.(e.target.checked)} /><span className="switch__track" /></label>
  ) : (
    <>{badge ? <span className="option-badge">{badge}</span> : null}<span className="option-arrow">›</span></>
  );
  const inner = (
    <>
      <span className={`option-icon ${tint}`}><Icon name={ic} size={22} /></span>
      <span className="option-details"><span className="option-title">{title}</span><span className="option-subtitle">{subtitle}</span></span>
      {right}
    </>
  );
  return href ? <Link className="option-item" href={href}>{inner}</Link> : <div className="option-item">{inner}</div>;
}
