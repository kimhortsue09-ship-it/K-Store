'use client';
/**
 * Address Book — faithful port: default banner, address cards (type + default badge +
 * edit/delete), and an add/edit form sheet. Uses addresses.css.
 */
import '../../styles/pages/addresses.css';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { haptic, tgConfirm } from '@/lib/telegram';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import type { Address } from '@/lib/types';

const TYPE_ICON: Record<string, string> = { home: '🏠', work: '🏢', other: '📍' };

export default function AddressesPage() {
  const router = useRouter();
  const { addresses, saveAddress, deleteAddress } = useStore();
  const [editing, setEditing] = useState<Partial<Address> | null>(null);
  const [f, setF] = useState<Record<string, string>>({});
  const [fdefault, setFdefault] = useState(false);
  const hasDefault = addresses.some((a) => a.default);

  const setDefault = (id: string) => { addresses.forEach((a) => saveAddress({ ...a, default: a.id === id })); haptic('selection'); };
  const del = async (id: string) => { if (await tgConfirm(t('addresses.delete_confirm'))) { deleteAddress(id); haptic('medium'); } };

  const openEdit = (a: Address | null) => {
    const d: Partial<Address> = a || {};
    setEditing(d);
    setF({
      type: (d.label || 'home').toLowerCase(),
      first: (d.name || '').split(' ')[0] || '',
      last: (d.name || '').split(' ').slice(1).join(' '),
      line1: d.line1 || '', line2: d.line2 || '', city: d.city || '', region: d.region || '', postal: d.postal || '', country: d.country || '', phone: d.phone || '',
    });
    setFdefault(Boolean(d.default));
  };
  const upd = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((prev) => ({ ...prev, [k]: e.target.value }));
  const submit = () => {
    if (!f.first || !f.line1 || !f.city) { haptic('error'); return; }
    saveAddress({
      id: editing?.id || `addr-${Date.now().toString(36)}`,
      label: f.type.charAt(0).toUpperCase() + f.type.slice(1),
      name: `${f.first} ${f.last}`.trim(), line1: f.line1, line2: f.line2, city: f.city, region: f.region, postal: f.postal, country: f.country, phone: f.phone,
      default: fdefault || Boolean(editing?.default),
    });
    haptic('success');
    setEditing(null);
  };

  return (
    <>
      <header className="addresses-header"><div className="header-top">
        <button className="back-button" aria-label="Back" onClick={() => router.push('/profile')}><Icon name="back" size={24} /></button>
        <div className="header-center"><h1 className="page-title">{t('addresses.title')}</h1><span className="addresses-subtitle">{t('addresses.subtitle')}</span></div>
        <button className="add-button" aria-label={t('addresses.add')} onClick={() => openEdit(null)}><Icon name="plus" size={24} /></button>
      </div></header>

      <main className="screen">
        <div className="addresses-content">
          {addresses.length > 0 && !hasDefault && (
            <div className="default-address-banner"><div className="banner-icon">🏠</div><div className="banner-text"><strong>{t('addresses.set_default_banner')}</strong>{t('addresses.set_default_banner_sub')}</div></div>
          )}
          {addresses.length ? (
            <div className="addresses-list">
              {addresses.map((a) => {
                const type = (a.label || 'home').toLowerCase();
                return (
                  <div key={a.id} className={`address-card${a.default ? ' default' : ''}`}>
                    <div className="address-card__top">
                      <div className="address-type">{TYPE_ICON[type] || '📍'} {a.label || 'Home'}{a.default && <span className="default-badge">{t('addresses.default_badge')}</span>}</div>
                      <div className="address-actions">
                        <button className="address-action-btn" aria-label={t('action.edit')} onClick={() => openEdit(a)}><Icon name="edit" size={16} /></button>
                        <button className="address-action-btn delete" aria-label={t('action.remove')} onClick={() => del(a.id)}><Icon name="trash" size={16} /></button>
                      </div>
                    </div>
                    <div className="address-details">
                      <div className="address-name">{a.name}</div>
                      <div className="address-text">{[a.line1, a.line2].filter(Boolean).join(', ')}<br />{[a.city, a.region, a.postal].filter(Boolean).join(', ')}<br />{a.country}{a.phone ? ' · ' + a.phone : ''}</div>
                    </div>
                    {!a.default && <button className="address-set-default" onClick={() => setDefault(a.id)}>{t('addresses.set_as_default')}</button>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-addresses"><div className="empty-icon">📍</div><h3 className="empty-title">{t('addresses.empty')}</h3><p>{t('addresses.empty_hint')}</p>
              <button className="add-address-btn" onClick={() => openEdit(null)}>{t('addresses.add')}</button></div>
          )}
        </div>
      </main>

      {editing && (
        <Sheet title={editing.id ? t('addresses.edit_title') : t('addresses.add_title')} onClose={() => setEditing(null)}>
          <div className="field"><label className="field__label" htmlFor="ad-type">{t('addresses.type')}</label>
            <select id="ad-type" className="input" value={f.type} onChange={upd('type')}>{[['home', 'addresses.type_home'], ['work', 'addresses.type_work'], ['other', 'addresses.type_other']].map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}</select></div>
          <div className="form-grid">
            <div className="field"><label className="field__label" htmlFor="ad-first">{t('addresses.first_name')}</label><input id="ad-first" className="input" value={f.first} onChange={upd('first')} /></div>
            <div className="field"><label className="field__label" htmlFor="ad-last">{t('addresses.last_name')}</label><input id="ad-last" className="input" value={f.last} onChange={upd('last')} /></div>
          </div>
          <div className="field"><label className="field__label" htmlFor="ad-line1">{t('addresses.line1')}</label><input id="ad-line1" className="input" value={f.line1} onChange={upd('line1')} placeholder={t('addresses.line1_ph')} /></div>
          <div className="field"><label className="field__label" htmlFor="ad-line2">{t('addresses.line2')}</label><input id="ad-line2" className="input" value={f.line2} onChange={upd('line2')} placeholder={t('addresses.line2_ph')} /></div>
          <div className="form-grid">
            <div className="field"><label className="field__label" htmlFor="ad-city">{t('addresses.city')}</label><input id="ad-city" className="input" value={f.city} onChange={upd('city')} /></div>
            <div className="field"><label className="field__label" htmlFor="ad-region">{t('addresses.region')}</label><input id="ad-region" className="input" value={f.region} onChange={upd('region')} /></div>
          </div>
          <div className="form-grid">
            <div className="field"><label className="field__label" htmlFor="ad-postal">{t('addresses.postal')}</label><input id="ad-postal" className="input" value={f.postal} onChange={upd('postal')} /></div>
            <div className="field"><label className="field__label" htmlFor="ad-country">{t('addresses.country')}</label><input id="ad-country" className="input" value={f.country} onChange={upd('country')} /></div>
          </div>
          <div className="field"><label className="field__label" htmlFor="ad-phone">{t('addresses.phone')}</label><input id="ad-phone" className="input" value={f.phone} onChange={upd('phone')} placeholder={t('addresses.phone_ph')} /></div>
          <label className="checkbox-container" style={{ marginBottom: 16 }}><input type="checkbox" checked={fdefault} onChange={(e) => setFdefault(e.target.checked)} /><span className="checkmark" /><span className="checkbox-text">{t('addresses.set_default_check')}</span></label>
          <button className="btn btn--block" onClick={submit}>{t('addresses.save')}</button>
        </Sheet>
      )}
    </>
  );
}
