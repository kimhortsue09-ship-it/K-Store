/**
 * Nova Kit — Shared TypeScript types
 * The single source of truth for the shapes used across the app (products, cart, orders,
 * and the central configuration). Everything is strongly typed end-to-end.
 */

export type ProductType = 'physical' | 'digital';

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: ProductType;
  subcategories?: { id: string; name: string; count: number }[];
}

/** A selectable product option (e.g. colour / size), shown as `.variant-chip`s on the product page. */
export interface ProductVariant {
  id: string;
  label: string;
}

/**
 * One deliverable for a digital product: either an uploaded file or an external download link.
 * In the demo, an uploaded file is held as a data-URL in localStorage — fine for small samples,
 * but in production you should upload to object storage / a CDN and store only the URL here.
 */
export type DigitalAsset =
  | { kind: 'file'; name: string; size: number; dataUrl: string }
  | { kind: 'link'; label: string; url: string };

/** Delivery details for `type: 'digital'` products — drives the specs rows and /downloads. */
export interface DigitalInfo {
  platform: string;
  format: string;
  license: string;
  /** The actual deliverables (files and/or links) handed to the buyer on the Downloads page. */
  assets?: DigitalAsset[];
}

/** One entry in a product's image gallery: a real upload, or a generated emoji placeholder. */
export type GalleryEntry =
  | { kind: 'image'; src: string }
  | { kind: 'emoji'; emoji: string; color: string };

export interface Product {
  id: string;
  name: string;
  /** URL-friendly name — kept in parity with the HTML edition's catalog. */
  slug?: string;
  price: number;
  originalPrice?: number;
  type: ProductType;
  categoryId: string;
  subcategoryId?: string;
  /** One-line summary used on cards; `description` is the full copy. */
  shortDescription?: string;
  inStock: boolean;
  stock: number;
  rating: number;
  reviewCount: number;
  badges: string[];
  emoji: string;
  color: string;
  image?: string;
  description: string;
  specs?: Record<string, string>;
  variants?: ProductVariant[];
  digital?: DigitalInfo;
  gallery?: GalleryEntry[];
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  qty: number;
  type: ProductType;
  emoji: string;
  image?: string;
  variant?: string;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
}

export interface Promo {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  label: string;
}

export interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postal: string;
  country: string;
  default?: boolean;
}

export interface Order {
  id: string;
  number: string;
  createdAt: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  address?: Address;
  paymentMethod: string;
  paymentProvider?: string;
  paymentStatus?: string;
  paymentReference?: string | null;
  shippingMethod?: string;
  /** The promo code applied at checkout, if any (already reflected in `discount`). */
  promo?: Promo | null;
  /** The shopper's own note left at checkout. */
  notes?: string;
  /** Carrier tracking number, set by the merchant in the admin order screen. */
  tracking?: string;
  /** Private merchant-only note. Distinct from `notes` (which belongs to the shopper). */
  adminNote?: string;
}

/* ---- Configuration types ------------------------------------------------------------- */

export type ColorScheme = 'auto' | 'light' | 'dark';

export interface BrandConfig {
  name: string;
  shortName: string;
  tagline: string;
  logoEmoji: string;
  logoSvg: string | null;
  author: string;
  supportUrl: string;
}

export interface ThemeConfig {
  colorScheme: ColorScheme;
  allowUserToggle: boolean;
  accent: string | null;
  accentContrast: string | null;
  radius: number;
  fontFamily: string;
  followTelegramTheme: boolean;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  position: 'before' | 'after';
  decimals: number;
  thousands: string;
  decimal: string;
}

export interface CommerceConfig {
  taxRate: number;
  shippingFlat: number;
  freeShippingThreshold: number;
  maxQtyPerItem: number;
  enablePromo: boolean;
  promoCodes: Record<string, { type: 'percentage' | 'fixed'; value: number; label: string }>;
}

export interface PaymentMethod {
  id: string;
  provider: 'telegramStars' | 'tonConnect' | 'stripe' | 'manual';
  label: string;
  icon: string;
  enabled: boolean;
  note?: string;
}

export interface PaymentsConfig {
  methods: PaymentMethod[];
  providers: {
    telegramStars: { enabled: boolean; createInvoiceUrl: string; starsPerUnit: number };
    tonConnect: { enabled: boolean; manifestUrl: string; recipientAddress: string; tonPerUnit: number; validSeconds: number };
    stripe: {
      enabled: boolean;
      mode: 'checkout' | 'paymentLink';
      publishableKey: string;
      checkoutUrl: string;
      paymentLinkUrl: string;
      supportedCountries: string[];
    };
  };
  demoSimulate: boolean;
}

export interface AppConfig {
  brand: BrandConfig;
  theme: ThemeConfig;
  locale: { default: string; available: string[]; rtlLocales: string[] };
  currency: CurrencyConfig;
  commerce: CommerceConfig;
  features: Record<string, boolean>;
  payments: PaymentsConfig;
  nav: { tabs: { id: string; label: string; icon: string; href: string }[] };
  data: { source: 'mock' | 'api'; apiBaseUrl: string; persistNamespace: string };
  telegram: { enabled: boolean; expand: boolean; haptics: boolean; closingConfirmation: boolean };
}

export interface PaymentResult {
  status: 'paid' | 'pending' | 'redirect' | 'failed';
  provider: string;
  reference?: string | null;
  simulated?: boolean;
  stars?: number;
  ton?: number;
  error?: string;
  note?: string;
}
