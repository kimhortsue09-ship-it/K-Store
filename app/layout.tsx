import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { config } from '@/config';
import { Providers } from './providers';
import './globals.css';
// Real Nova Kit stylesheets (shared with the HTML edition) — the pages use these exact
// classes so the React edition renders pixel-identically. Per-page CSS is imported by each page.
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/components.css';
// customer.css is a shared "customer pages" bundle in the HTML edition (loaded by 18 pages:
// wallet, profile, orders, wishlist, addresses, help, search…). Its selectors are all
// page-scoped classes, so we load it globally here rather than risk any page forgetting the
// per-page import (which left the wallet card / profile avatar / FAQ etc. unstyled).
import '../styles/pages/customer.css';

const initialTheme = config.theme.colorScheme === 'light' ? 'light' : 'dark';
const initialDir = config.locale.rtlLocales.includes(config.locale.default) ? 'rtl' : 'ltr';

export const metadata: Metadata = {
  title: `${config.brand.name} — Telegram Mini App`,
  description: config.brand.tagline,
};

export const viewport: Viewport = {
  themeColor: '#FFFFFF',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

/* Applies the saved (or configured) theme before paint to avoid a flash. */
const themeScript = `(function(){try{var k='${config.data.persistNamespace}:theme';var t=localStorage.getItem(k)||'${initialTheme}';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={config.locale.default} dir={initialDir} data-theme={initialTheme} suppressHydrationWarning>
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning className="app">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
