'use client';
/** Help & Support — faithful port: quick actions, topics, FAQ accordion, contact cards. Uses help.css. */
import '../../styles/pages/help.css';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { config } from '@/config';
import { t } from '@/lib/i18n';
import { tgAlert } from '@/lib/telegram';
import { Icon } from '@/components/Icon';

const QUICK = [
  { icon: 'bag', titleKey: 'help.qa_track', subKey: 'help.qa_track_sub', href: '/track-order' },
  { icon: 'box', titleKey: 'help.qa_returns', subKey: 'help.qa_returns_sub', href: '/returns' },
  { icon: 'card', titleKey: 'help.qa_payments', subKey: 'help.qa_payments_sub', href: '/payment-methods' },
  { icon: 'send', titleKey: 'help.qa_contact', subKey: 'help.qa_contact_sub', href: '/support' },
];
const TOPICS = [
  { icon: '📦', tint: 'tint-green', titleKey: 'help.topic_orders', subKey: 'help.topic_orders_sub', href: '/orders' },
  { icon: '💳', tint: 'tint-purple', titleKey: 'help.topic_payments', subKey: 'help.topic_payments_sub', href: '/payment-methods' },
  { icon: '↩️', tint: 'tint-orange', titleKey: 'help.topic_returns', subKey: 'help.topic_returns_sub', href: '/returns' },
  { icon: '🔒', tint: 'tint-blue', titleKey: 'help.topic_account', subKey: 'help.topic_account_sub', href: '/legal?doc=privacy' },
];
const FAQS: [string, string][] = [
  ['help.faq_q1', 'help.faq_a1'],
  ['help.faq_q2', 'help.faq_a2'],
  ['help.faq_q3', 'help.faq_a3'],
  ['help.faq_q4', 'help.faq_a4'],
  ['help.faq_q5', 'help.faq_a5'],
];

export default function HelpPage() {
  const router = useRouter();
  // Multiple FAQ items can be open at once (the HTML kit toggles `.open` per item).
  const [open, setOpen] = useState<Set<number>>(new Set());
  const toggleFaq = (i: number) => setOpen((prev) => {
    const next = new Set(prev);
    if (!next.delete(i)) next.add(i);
    return next;
  });
  const contact = () => { if (config.brand.supportUrl && typeof window !== 'undefined') window.open(config.brand.supportUrl, '_blank'); else void tgAlert('Live chat opens your support channel in production. Set config.brand.supportUrl.'); };

  return (
    <>
      <header className="help-header"><div className="header-top">
        <button className="back-button" aria-label="Back" onClick={() => router.push('/profile')}><Icon name="back" size={24} /></button>
        <div className="header-center"><h1 className="page-title">{t('profile.help')}</h1><span className="help-subtitle">{t('help.subtitle')}</span></div>
        <span style={{ width: 40 }} />
      </div></header>

      <main className="screen">
        <div className="help-content">
          <div className="quick-actions-section"><h3 className="section-title">{t('help.quick_actions')}</h3>
            <div className="quick-actions-grid">
              {QUICK.map((q) => (
                <Link key={q.titleKey} className="quick-action-item" href={q.href}>
                  <span className="action-icon"><Icon name={q.icon} size={20} /></span>
                  <span><span className="action-title">{t(q.titleKey)}</span><br /><span className="action-subtitle">{t(q.subKey)}</span></span>
                </Link>
              ))}
            </div>
          </div>

          <div className="help-categories-section"><h3 className="section-title">{t('help.browse_topics')}</h3>
            <div className="categories-grid">
              {TOPICS.map((c) => (
                <Link key={c.titleKey} className="help-category-item" href={c.href}>
                  <span className={`category-icon ${c.tint}`}>{c.icon}</span>
                  <span><span className="category-title">{t(c.titleKey)}</span><br /><span className="category-subtitle">{t(c.subKey)}</span></span>
                  <span className="faq-arrow"><Icon name="chevron" size={18} /></span>
                </Link>
              ))}
            </div>
          </div>

          <div className="faq-section"><h3 className="section-title">{t('help.faq')}</h3>
            <div className="faq-list">
              {FAQS.map(([q, a], i) => (
                <div key={i} className={`faq-item${open.has(i) ? ' open' : ''}`}>
                  <button className="faq-question" onClick={() => toggleFaq(i)}><Icon name="help" size={18} /> <span className="faq-text">{t(q)}</span><span className="faq-arrow"><Icon name="chevron" size={18} /></span></button>
                  <div className="faq-answer"><p>{t(a)}</p></div>
                </div>
              ))}
            </div>
          </div>

          <div className="contact-info-section"><h3 className="section-title">{t('help.contact_us')}</h3>
            <div className="contact-card">
              <button className="contact-item" onClick={contact}><span className="contact-icon"><Icon name="send" size={20} /></span><span><span className="contact-label">{t('help.live_chat')}</span><br /><span className="contact-value">{t('help.live_chat_sub')}</span></span></button>
              <div className="contact-item"><span className="contact-icon">✉️</span><span><span className="contact-label">{t('help.email')}</span><br /><span className="contact-value">support@novastore.app</span></span></div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
