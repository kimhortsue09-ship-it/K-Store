/**
 * Nova Kit — Central Configuration (Next.js edition)
 * ==================================================
 * The ONE file you edit to make the kit your own: brand, colours, currency, tax/shipping,
 * promo codes, feature flags, payments, navigation, locale and data source. Pages and
 * components read from here, so editing this re-skins and re-scopes the whole app.
 * Visual tokens live in app/globals.css; the `theme` block below overrides the key ones.
 *
 * Author: unusdon
 */
import type { AppConfig } from '@/lib/types';

export const config: AppConfig = {
  brand: {
    name: 'Nova Store',
    shortName: 'Nova',
    tagline: 'Shop smarter, right inside chat',
    logoEmoji: '🛍️',
    logoSvg: null,
    author: 'unusdon',
    supportUrl: '',
  },

  theme: {
    colorScheme: 'light', // 'auto' | 'light' | 'dark' — Telegram-native white default (dark stays on the toggle)
    allowUserToggle: true,
    accent: null, // e.g. '#00E676' to force one brand colour across both themes
    accentContrast: null,
    radius: 16,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    followTelegramTheme: true,
  },

  locale: {
    default: 'en',
    available: ['en', 'es', 'ar'],
    rtlLocales: ['ar'],
  },

  currency: {
    code: 'USD',
    symbol: '$',
    position: 'before',
    decimals: 2,
    thousands: ',',
    decimal: '.',
  },

  commerce: {
    taxRate: 0.08,
    shippingFlat: 9.99,
    freeShippingThreshold: 150,
    maxQtyPerItem: 10,
    enablePromo: true,
    promoCodes: {
      SAVE20: { type: 'percentage', value: 20, label: '20% off' },
      WELCOME10: { type: 'percentage', value: 10, label: '10% off your first order' },
      FREESHIP: { type: 'fixed', value: 9.99, label: 'Free shipping' },
    },
  },

  features: {
    onboarding: true,
    search: true,
    categories: true,
    wishlist: true,
    reviews: true,
    ratings: true,
    digitalProducts: true,
    promo: true,
    addresses: true,
    paymentMethods: true,
    notifications: true,
    languageSwitcher: true,
    admin: true,
  },

  payments: {
    methods: [
      { id: 'stars', provider: 'telegramStars', label: 'Telegram Stars', icon: '⭐', enabled: true, note: 'Pay in-app with Stars' },
      { id: 'ton', provider: 'tonConnect', label: 'TON', icon: '💎', enabled: true, note: 'Pay from your TON wallet' },
      { id: 'stripe', provider: 'stripe', label: 'Card', icon: '💳', enabled: true, note: 'Visa, Mastercard, Amex' },
      { id: 'cod', provider: 'manual', label: 'Cash on Delivery', icon: '💵', enabled: true, note: 'Pay when your order arrives' },
    ],
    providers: {
      telegramStars: { enabled: true, createInvoiceUrl: '', starsPerUnit: 50 },
      tonConnect: { enabled: true, manifestUrl: '', recipientAddress: '', tonPerUnit: 0.25, validSeconds: 600 },
      stripe: { enabled: true, mode: 'checkout', publishableKey: '', checkoutUrl: '', paymentLinkUrl: '', supportedCountries: [] },
    },
    demoSimulate: true,
  },

  nav: {
    tabs: [
      { id: 'home', label: 'Home', icon: 'home', href: '/' },
      { id: 'catalog', label: 'Shop', icon: 'grid', href: '/catalog' },
      { id: 'wishlist', label: 'Wishlist', icon: 'heart', href: '/wishlist' },
      { id: 'orders', label: 'Orders', icon: 'bag', href: '/orders' },
      { id: 'profile', label: 'Profile', icon: 'user', href: '/profile' },
    ],
  },

  data: {
    source: 'mock', // 'mock' (bundled catalog + localStorage) | 'api'
    apiBaseUrl: '',
    persistNamespace: 'nova',
  },

  telegram: {
    enabled: true,
    expand: true,
    haptics: true,
    closingConfirmation: true,
  },
};

export default config;
