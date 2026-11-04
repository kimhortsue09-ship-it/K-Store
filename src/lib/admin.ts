/**
 * Nova Kit — Admin data & navigation
 * Demo orders/customers plus derived stats for the merchant dashboard. Admin views merge
 * these with the shopper's real orders from the store. Swap for your API in production.
 */
import type { Order, Product, ProductType } from './types';

export interface AdminNavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home', href: '/admin' },
  { id: 'orders', label: 'Orders', icon: 'bag', href: '/admin/orders' },
  { id: 'returns', label: 'Returns', icon: 'box', href: '/admin/returns' },
  { id: 'abandoned', label: 'Abandoned', icon: 'cart', href: '/admin/abandoned' },
  { id: 'products', label: 'Products', icon: 'box', href: '/admin/products' },
  { id: 'collections', label: 'Collections', icon: 'grid', href: '/admin/collections' },
  { id: 'keys', label: 'Digital Keys', icon: 'lock', href: '/admin/keys' },
  { id: 'categories', label: 'Categories', icon: 'grid', href: '/admin/categories' },
  { id: 'inventory', label: 'Inventory', icon: 'box', href: '/admin/inventory' },
  { id: 'questions', label: 'Q&A', icon: 'help', href: '/admin/questions' },
  { id: 'customers', label: 'Customers', icon: 'users', href: '/admin/customers' },
  { id: 'support', label: 'Support', icon: 'help', href: '/admin/support' },
  { id: 'content', label: 'Content', icon: 'image', href: '/admin/content' },
  { id: 'wallet', label: 'Wallets', icon: 'card', href: '/admin/wallet' },
  { id: 'transactions', label: 'Transactions', icon: 'card', href: '/admin/transactions' },
  { id: 'payouts', label: 'Payouts', icon: 'download', href: '/admin/payouts' },
  { id: 'analytics', label: 'Analytics', icon: 'chart', href: '/admin/analytics' },
  { id: 'reports', label: 'Reports', icon: 'chart', href: '/admin/reports' },
  { id: 'marketing', label: 'Marketing', icon: 'tag', href: '/admin/marketing' },
  { id: 'discounts', label: 'Discounts', icon: 'tag', href: '/admin/discounts' },
  { id: 'giftcards', label: 'Gift Cards', icon: 'gift', href: '/admin/gift-cards' },
  { id: 'loyalty', label: 'Loyalty', icon: 'star', href: '/admin/loyalty' },
  { id: 'referrals', label: 'Referrals', icon: 'gift', href: '/admin/referrals' },
  { id: 'broadcast', label: 'Broadcast', icon: 'send', href: '/admin/broadcast' },
  { id: 'templates', label: 'Templates', icon: 'image', href: '/admin/templates' },
  { id: 'reviews', label: 'Reviews', icon: 'star', href: '/admin/reviews' },
  { id: 'shipping', label: 'Shipping', icon: 'truck', href: '/admin/shipping' },
  { id: 'payments', label: 'Payments', icon: 'card', href: '/admin/payments' },
  { id: 'integrations', label: 'Integrations', icon: 'plug', href: '/admin/integrations' },
  { id: 'activity', label: 'Activity Log', icon: 'clock', href: '/admin/activity' },
  { id: 'staff', label: 'Staff', icon: 'users', href: '/admin/staff' },
  { id: 'settings', label: 'Settings', icon: 'gear', href: '/admin/settings' },
];
export const ADMIN_PRIMARY = ['dashboard', 'orders', 'products', 'analytics'];

type Item = { pid: string; name: string; price: number; emoji: string; image: string; type: ProductType; qty: number };

function mk(number: string, name: string, status: Order['status'], date: string, items: Item[]): Order {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = items.some((i) => i.type === 'physical') ? 9.99 : 0;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  return {
    id: number,
    number,
    createdAt: `${date}T10:00:00Z`,
    status,
    items: items.map((i, idx) => ({ id: `${number}-${idx}`, productId: i.pid, name: i.name, price: i.price, qty: i.qty, type: i.type, emoji: i.emoji, image: i.image })),
    subtotal,
    discount: 0,
    shipping,
    tax,
    total: Math.round((subtotal + shipping + tax) * 100) / 100,
    address: { id: 'a', label: 'Home', name, phone: '+1 555 0100', line1: '123 Market St', city: 'Riverton', region: 'NJ', postal: '12345', country: 'United States' },
    paymentMethod: 'Card',
  };
}

export const DEMO_ORDERS: Order[] = [
  mk('NV-2048', 'Amelia Stone', 'delivered', '2024-06-28', [{ pid: 'p-aurora-buds', name: 'Aurora Wireless Earbuds', price: 89, emoji: '🎧', image: '/products/earbuds.jpg', type: 'physical', qty: 1 }, { pid: 'p-photon-suite', name: 'Photon Photo Suite', price: 59, emoji: '🎨', image: '/products/app.jpg', type: 'digital', qty: 1 }]),
  mk('NV-2047', 'Marco Diaz', 'shipped', '2024-06-27', [{ pid: 'p-nimbus-phone', name: 'Nimbus 5G Phone', price: 699, emoji: '📱', image: '/products/phone.jpg', type: 'physical', qty: 1 }]),
  mk('NV-2046', 'Priya Kapoor', 'paid', '2024-06-27', [{ pid: 'p-terra-jacket', name: 'Terra Field Jacket', price: 74, emoji: '🧥', image: '/products/jacket.jpg', type: 'physical', qty: 2 }]),
  mk('NV-2045', 'Sam Rivera', 'pending', '2024-06-26', [{ pid: 'p-craft-guide', name: 'The Craft of Code', price: 14.99, emoji: '📘', image: '/products/book.jpg', type: 'digital', qty: 1 }]),
  mk('NV-2044', 'Lena Vogel', 'delivered', '2024-06-25', [{ pid: 'p-brew-kettle', name: 'Brew Electric Kettle', price: 39, emoji: '🫖', image: '/products/kettle.jpg', type: 'physical', qty: 1 }, { pid: 'p-luna-bag', name: 'Luna Crossbody Bag', price: 45, emoji: '👜', image: '/products/bag.jpg', type: 'physical', qty: 1 }]),
  mk('NV-2043', 'Ade Okafor', 'cancelled', '2024-06-24', [{ pid: 'p-terra-vase', name: 'Terra Ceramic Vase', price: 34, emoji: '🏺', image: '/products/vase.jpg', type: 'physical', qty: 1 }]),
];

/** Merge the shopper's real orders (from the store) with the demo history for admin views. */
export function mergedOrders(storeOrders: Order[]): Order[] {
  return [...storeOrders, ...DEMO_ORDERS];
}

/**
 * Deterministic demo customers — identical to the HTML edition's `admin/admin-data.js`
 * `demoCustomers`, so both editions show the same people. The extra fields (userId, handle,
 * phone, location, lastActive, status) are real here; the admin pages used to fake them.
 */
export interface AdminCustomer {
  id: string;
  userId: string;
  name: string;
  handle: string;
  email: string;
  phone: string;
  orders: number;
  spent: number;
  /** Loyalty points balance — drives the tier shown on the customer + loyalty screens. */
  points: number;
  joined: string;
  lastActive: string;
  location: string;
  status: 'active' | 'banned';
}
export const DEMO_CUSTOMERS: AdminCustomer[] = [
  { id: 'c-01', userId: '80421567', name: 'Amara Okafor', handle: '@amara', email: 'amara@example.com', phone: '+234 803 555 0112', orders: 12, spent: 1840.5, points: 1840, joined: '2024-02-11', lastActive: '2024-07-02', location: 'Lagos, NG', status: 'active' },
  { id: 'c-02', userId: '61209833', name: 'Liam Brooks', handle: '@liamb', email: 'liam.b@example.com', phone: '+44 7700 900311', orders: 5, spent: 620.0, points: 620, joined: '2024-05-03', lastActive: '2024-06-28', location: 'Leeds, UK', status: 'active' },
  { id: 'c-03', userId: '74558021', name: 'Sofia Marín', handle: '@sofiam', email: 'sofia.m@example.com', phone: '+34 612 34 56 78', orders: 8, spent: 1130.25, points: 1130, joined: '2024-03-27', lastActive: '2024-07-01', location: 'Madrid, ES', status: 'active' },
  { id: 'c-04', userId: '90833471', name: 'Kenji Tanaka', handle: '@kenji', email: 'kenji.t@example.com', phone: '+81 90 1234 5678', orders: 3, spent: 289.99, points: 290, joined: '2024-06-19', lastActive: '2024-06-20', location: 'Osaka, JP', status: 'banned' },
  { id: 'c-05', userId: '55712094', name: 'Noor Haddad', handle: '@noorh', email: 'noor.h@example.com', phone: '+962 7 9012 3456', orders: 15, spent: 2450.0, points: 2450, joined: '2023-12-08', lastActive: '2024-07-03', location: 'Amman, JO', status: 'active' },
];

/* ---- Loyalty ------------------------------------------------------------------------- */

/** Loyalty tiers, ascending by threshold. Shared by the loyalty screen and the customer sheet. */
export interface LoyaltyTier { name: string; min: number; perk: string; color: string }
export const LOYALTY_TIERS: LoyaltyTier[] = [
  { name: 'Bronze', min: 0, perk: 'Standard earning', color: 'tint-orange' },
  { name: 'Silver', min: 500, perk: '1.25× points', color: 'tint-blue' },
  { name: 'Gold', min: 2000, perk: '1.5× points + free shipping', color: 'tint-orange' },
  { name: 'Platinum', min: 5000, perk: '2× points + early access', color: 'tint-purple' },
];

/** The highest tier a points balance qualifies for. */
export function tierFor(points: number, tiers: LoyaltyTier[] = LOYALTY_TIERS): LoyaltyTier {
  return [...tiers].reverse().find((t) => points >= t.min) ?? tiers[0];
}

/** Customers ranked by loyalty points — the loyalty screen's "Top members". */
export function topMembers(limit = 4): AdminCustomer[] {
  return [...DEMO_CUSTOMERS].sort((a, b) => b.points - a.points).slice(0, limit);
}

/** The staff record for a customer, matched on Telegram handle — or null if they aren't staff. */
export function staffFor(handle: string): StaffMember | null {
  return DEMO_STAFF.find((s) => s.handle.toLowerCase() === handle.toLowerCase()) ?? null;
}

/** 7-day sales series — the HTML edition's exact values (admin-data.js `getSalesSeries`). */
export const SALES_SERIES: [string, number][] = [
  ['Mon', 820], ['Tue', 610], ['Wed', 940], ['Thu', 1180], ['Fri', 760], ['Sat', 1520], ['Sun', 1340],
];

export function adminStats(orders: Order[], products: Product[] = []) {
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  return {
    revenue,
    orders: orders.length,
    products: products.length,
    customers: DEMO_CUSTOMERS.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    lowStock: products.filter((p) => p.inStock && p.stock <= 15).length,
    aov: orders.length ? revenue / orders.length : 0,
  };
}

/** Top sellers — the HTML's algorithm: sold = round(reviewCount * 0.6), sorted desc, top 5. */
export function topProducts(products: Product[]): { product: Product; sold: number }[] {
  return [...products]
    .map((p) => ({ product: p, sold: Math.round(p.reviewCount * 0.6) }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);
}

export interface Abandoned { id: string; customer: string; handle: string; items: number; value: number; updated: string }
export const DEMO_ABANDONED: Abandoned[] = [
  { id: 'ab-01', customer: 'Amara Okafor', handle: '@amara', items: 2, value: 178, updated: '2024-07-03T14:20:00Z' },
  { id: 'ab-02', customer: 'Guest', handle: '—', items: 1, value: 699, updated: '2024-07-03T09:05:00Z' },
  { id: 'ab-03', customer: 'Sofia Marín', handle: '@sofiam', items: 3, value: 246, updated: '2024-07-02T18:40:00Z' },
];

/** Licence-key stock per digital product — matches the HTML's `demoKeys`, including the key pool. */
export interface KeyStock { id: string; name: string; available: number; sold: number; keys: string[] }
export const DEMO_KEYS: KeyStock[] = [
  { id: 'p-photon-suite', name: 'Photon Photo Suite', available: 42, sold: 358, keys: ['PHTN-7F3K-9QX2', 'PHTN-2M8D-4RA1', 'PHTN-5T6P-1KZ9'] },
  { id: 'p-void-runner', name: 'Void Runner (Game)', available: 8, sold: 175, keys: ['VOID-A1B2-C3D4', 'VOID-E5F6-G7H8'] },
  { id: 'p-craft-guide', name: 'The Craft of Code', available: 999, sold: 96, keys: [] },
];

/**
 * Team roster. `@sofiam` is deliberately also a customer (Sofia Marín) so the customer detail
 * sheet's "Staff" row has something to show — staff are matched to customers by handle.
 */
export interface StaffMember { id: string; name: string; handle: string; role: string; active: boolean }
export const DEMO_STAFF: StaffMember[] = [
  { id: 's1', name: 'You', handle: '@owner', role: 'Owner', active: true },
  { id: 's2', name: 'Dana Whitfield', handle: '@dana', role: 'Manager', active: true },
  { id: 's3', name: 'Marco Ruiz', handle: '@marco', role: 'Support', active: true },
  { id: 's4', name: 'Sofia Marín', handle: '@sofiam', role: 'Fulfilment', active: true },
];

export interface SupportTicket { id: string; subject: string; customer: string; status: 'open' | 'pending' | 'closed'; date: string }
export const DEMO_TICKETS: SupportTicket[] = [
  { id: 'T-2051', subject: 'Where is my order NV-1042?', customer: 'Amara Okafor', status: 'open', date: '2024-07-03T10:00:00Z' },
  { id: 'T-2049', subject: 'Refund not received', customer: 'Liam Brooks', status: 'pending', date: '2024-07-02T16:20:00Z' },
  { id: 'T-2044', subject: 'Wrong size delivered', customer: 'Sofia Marín', status: 'closed', date: '2024-06-29T09:15:00Z' },
];
