/**
 * Nova Kit — First-visit demo data for the shopper's store
 * Seeded once (guarded by a `:seeded` flag) so a fresh install shows populated Orders,
 * Downloads, Returns, Wishlist and Address Book. Delete these arrays (or clear the flag in
 * the store) to ship an empty storefront.
 */
import type { Address, CartItem, Order, ProductType } from '@/lib/types';

export const DEMO_WISHLIST: string[] = ['p-aurora-buds', 'p-nimbus-phone', 'p-photon-suite'];

export const DEMO_ADDRESSES: Address[] = [
  {
    id: 'addr-demo-1',
    label: 'Home',
    name: 'Alex Morgan',
    phone: '+1 415 555 0132',
    line1: '128 Market Street',
    line2: 'Apt 4B',
    city: 'San Francisco',
    region: 'CA',
    postal: '94103',
    country: 'United States',
    default: true,
  },
];

function item(productId: string, name: string, price: number, type: ProductType, emoji: string, qty = 1): CartItem {
  return { id: productId, productId, name, price, qty, type, emoji };
}

export const DEMO_ORDERS: Order[] = [
  {
    id: 'NV-1002',
    number: 'NV-1002',
    createdAt: '2024-06-27T15:30:00Z',
    status: 'shipped',
    items: [item('p-aurora-buds', 'Aurora Wireless Earbuds', 89, 'physical', '🎧')],
    subtotal: 89,
    discount: 0,
    shipping: 9.99,
    tax: 7.12,
    total: 106.11,
    address: DEMO_ADDRESSES[0],
    paymentMethod: 'Card',
    paymentProvider: 'stripe',
    paymentStatus: 'paid',
    shippingMethod: 'Express',
  },
  {
    id: 'NV-1001',
    number: 'NV-1001',
    createdAt: '2024-06-20T10:05:00Z',
    status: 'delivered',
    items: [
      item('p-photon-suite', 'Photon Photo Suite', 59, 'digital', '🎨'),
      item('p-craft-guide', 'The Craft of Code', 14.99, 'digital', '📘'),
    ],
    subtotal: 73.99,
    discount: 0,
    shipping: 0,
    tax: 5.92,
    total: 79.91,
    address: DEMO_ADDRESSES[0],
    paymentMethod: 'Telegram Stars',
    paymentProvider: 'telegramStars',
    paymentStatus: 'paid',
    shippingMethod: 'Digital',
  },
];
