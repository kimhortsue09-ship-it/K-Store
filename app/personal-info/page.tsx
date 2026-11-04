'use client';
/**
 * Personal Information — faithful port: photo (working device upload), grouped form sections,
 * notification toggles, a danger zone and the sticky "Save changes" bar. Edits live in local
 * form state and are only persisted on Save (so they can be abandoned), exactly like the HTML.
 * Uses personal-info.css.
 */
import '../../styles/pages/personal-info.css';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { config } from '@/config';
import { t } from '@/lib/i18n';
import { usePersistentState } from '@/lib/usePersistentState';
import { toast } from '@/lib/toast';
import { haptic, telegramUser, tgConfirm } from '@/lib/telegram';
import { Icon } from '@/components/Icon';
import { Switch } from '@/components/Switch';

const NS = config.data.persistNamespace;
const MAX = 2 * 1024 * 1024;
type Avatar = { type: 'image' | 'emoji'; value: string } | null;
type Prefs = { email: boolean; sms: boolean; marketing: boolean };
type P = { firstName: string; lastName: string; email: string; code: string; phone: string; prefs: Prefs };
const DEF_PREFS: Prefs = { email: true, sms: false, marketing: false };
const DEF: P = { firstName: '', lastName: '', email: '', code: '+1', phone: '', prefs: DEF_PREFS };

export default function PersonalInfoPage() {
  const router = useRouter();
  const [avatar, setAvatar] = usePersistentState<Avatar>(`${NS}:avatar`, null);
  const [saved, setSaved, ready] = usePersistentState<Partial<P>>(`${NS}:profile`, {});
  const [form, setForm] = useState<P>(DEF);
  const seeded = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /* Seed the form from what's saved, falling back to the Telegram user for the name (HTML parity). */
  useEffect(() => {
    if (!ready || seeded.current) return;
    seeded.current = true;
    const tgu = telegramUser();
    setForm({
      firstName: saved.firstName ?? tgu?.first_name ?? '',
      lastName: saved.lastName ?? tgu?.last_name ?? '',
      email: saved.email ?? '',
      code: saved.code ?? '+1',
      phone: saved.phone ?? '',
      prefs: saved.prefs ?? DEF_PREFS,
    });
  }, [ready, saved]);

  const set = (k: 'firstName' | 'lastName' | 'email' | 'code' | 'phone') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((d) => ({ ...d, [k]: value }));
  };
  const setPref = (k: keyof Prefs) => (v: boolean) => setForm((d) => ({ ...d, prefs: { ...d.prefs, [k]: v } }));

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) return toast('Please choose an image file', { kind: 'danger' });
    if (f.size > MAX) return toast('Image must be under 2 MB', { kind: 'danger' });
    const r = new FileReader();
    r.onload = () => {
      setAvatar({ type: 'image', value: String(r.result) });
      haptic('success');
      toast('Photo updated', { kind: 'success' });
    };
    r.readAsDataURL(f);
  };

  const save = () => {
    setSaved({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      code: form.code.trim(),
      phone: form.phone.trim(),
      prefs: form.prefs,
    });
    haptic('success');
    toast('Profile saved', { kind: 'success' });
  };

  const del = async () => {
    if (await tgConfirm(t('personal.delete_confirm'))) {
      haptic('error');
      toast('Account deletion is disabled in the demo', { kind: 'danger' });
    }
  };

  return (
    <>
      <header className="personal-info-header"><div className="header-top">
        <button className="back-button" aria-label="Back" onClick={() => router.push('/profile')}><Icon name="back" size={24} /></button>
        <div className="header-center"><h1 className="page-title">{t('personal.title')}</h1><span className="info-subtitle">{t('personal.subtitle')}</span></div>
        <button className="save-button" onClick={save}>{t('action.save')}</button>
      </div></header>

      <main className="screen screen--no-tabbar">
        <div className="personal-info-content">
          <div className="profile-photo-section">
            <div className="profile-photo"><div className="photo-placeholder">
              {avatar?.type === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar.value} alt="Profile photo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                avatar?.value || config.brand.logoEmoji
              )}
            </div></div>
            <button className="change-photo-btn" onClick={() => fileRef.current?.click()}>{t('profile.change_photo')}</button>
            <input ref={fileRef} type="file" accept="image/*" aria-label={t('profile.change_photo')} hidden onChange={onFile} />
          </div>

          <div className="form-section">
            <div className="form-section__title">{t('personal.basic_info')}</div>
            <div className="form-grid">
              <div className="field"><label className="field__label" htmlFor="p_first">{t('personal.first_name')}</label><input className="input" id="p_first" value={form.firstName} onChange={set('firstName')} /></div>
              <div className="field"><label className="field__label" htmlFor="p_last">{t('personal.last_name')}</label><input className="input" id="p_last" value={form.lastName} onChange={set('lastName')} /></div>
            </div>
            <div className="field"><label className="field__label" htmlFor="p_email">{t('personal.email')}</label><input className="input" id="p_email" type="email" value={form.email} onChange={set('email')} /></div>
            <div className="field"><label className="field__label" htmlFor="p_phone">{t('personal.phone')}</label>
              <div className="phone-input-container">
                <input className="input country-code" id="p_code" aria-label={t('personal.country_code')} value={form.code} onChange={set('code')} />
                <input className="input" id="p_phone" type="tel" value={form.phone} onChange={set('phone')} placeholder={t('personal.phone_ph')} />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section__title">{t('personal.notif_prefs')}</div>
            <div className="preferences-list">
              {([['email', 'personal.pref_email', 'personal.pref_email_desc'], ['sms', 'personal.pref_sms', 'personal.pref_sms_desc'], ['marketing', 'personal.pref_marketing', 'personal.pref_marketing_desc']] as const).map(([k, ti, d]) => (
                <div key={k} className="preference-item">
                  <div className="preference-info"><div className="preference-title">{t(ti)}</div><div className="preference-description">{t(d)}</div></div>
                  <Switch checked={form.prefs[k]} onChange={setPref(k)} />
                </div>
              ))}
            </div>
          </div>

          <div className="danger-zone">
            <div className="danger-zone__title">{t('personal.danger_zone')}</div>
            <div className="danger-zone__text">{t('personal.danger_text')}</div>
            <button className="danger-btn" onClick={del}>{t('personal.delete_account')}</button>
          </div>
        </div>
      </main>

      <div className="bottom-bar"><button className="btn btn--block" onClick={save}>{t('personal.save_changes')}</button></div>
    </>
  );
}
