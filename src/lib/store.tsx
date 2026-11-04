'use client';
/**
 * Nova Kit — Store (state + data service)
 * A React context that mirrors the vanilla kit's architecture: bundled catalog for reads,
 * and cart / wishlist / orders / addresses persisted to localStorage under the configured
 * namespace. Swap the read helpers for fetch() calls when config.data.source === 'api'.
 *
 * Usage:  const { cart, addToCart, cartCount } = useStore();
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { config } from '@/config';
import { products as CATALOG, categories as CATEGORIES } from '@/data/catalog';
import { DEMO_ORDERS, DEMO_WISHLIST, DEMO_ADDRESSES } from '@/data/demo';
import type { Address, CartItem, CartTotals, Order, Product, Promo } from './types';

const NS = config.data.persistNamespace;
const K = {
  cart: `${NS}:cart`,
  wishlist: `${NS}:wishlist`,
  orders: `${NS}:orders`,
  addresses: `${NS}:addresses`,
  promo: `${NS}:promo`,
  seeded: `${NS}:seeded`,
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / privacy mode — ignore */
  }
}

/** Pure totals calculator — shared by the cart and checkout. */
export function cartTotals(cart: CartItem[], promo: Promo | null, shipping = 0): CartTotals {
  const subtotal = cart.reduce((s, it) => s + it.price * it.qty, 0);
  const hasPhysical = cart.some((it) => it.type === 'physical');
  let discount = 0;
  if (promo) discount = promo.type === 'percentage' ? (subtotal * promo.value) / 100 : promo.value;
  discount = Math.min(discount, subtotal);
  const ship = !hasPhysical ? 0
    : subtotal - discount >= config.commerce.freeShippingThreshold && config.commerce.freeShippingThreshold > 0
      ? 0 : shipping;
  const tax = Math.max(0, (subtotal - discount)) * config.commerce.taxRate;
  const total = Math.max(0, subtotal - discount) + ship + tax;
  const itemCount = cart.reduce((n, it) => n + it.qty, 0);
  return {
    subtotal, discount, shipping: ship,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
    itemCount,
  };
}

/** A product review (deterministically generated in the demo data source). */
export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  body: string;
}

interface StoreValue {
  ready: boolean;
  // data
  products: Product[];
  getProduct: (id: string) => Product | undefined;
  getReviews: (productId: string) => Review[];
  categories: typeof CATEGORIES;
  // cart
  cart: CartItem[];
  cartCount: number;
  addToCart: (p: Product, qty?: number, variant?: string) => void;
  updateQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  // wishlist
  wishlist: string[];
  isWished: (id: string) => boolean;
  toggleWishlist: (id: string) => boolean;
  // orders + addresses
  orders: Order[];
  placeOrder: (draft: Omit<Order, 'id' | 'number' | 'createdAt' | 'status'> & { status?: Order['status'] }) => Order;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  addresses: Address[];
  saveAddress: (address: Address) => void;
  deleteAddress: (id: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);

  // Hydrate from localStorage after mount (SSR-safe — avoids hydration mismatch).
  // On the very first visit, seed demo orders / wishlist / addresses so the storefront
  // looks populated out of the box. Guarded by a `:seeded` flag so we never re-seed after
  // the shopper clears their own data.
  useEffect(() => {
    const seeded = read<boolean>(K.seeded, false);
    setCart(read<CartItem[]>(K.cart, []));
    if (!seeded) {
      const w = read<string[]>(K.wishlist, []);
      const o = read<Order[]>(K.orders, []);
      const a = read<Address[]>(K.addresses, []);
      setWishlist(w.length ? w : DEMO_WISHLIST);
      setOrders(o.length ? o : DEMO_ORDERS);
      setAddresses(a.length ? a : DEMO_ADDRESSES);
      write(K.seeded, true);
    } else {
      setWishlist(read<string[]>(K.wishlist, []));
      setOrders(read<Order[]>(K.orders, []));
      setAddresses(read<Address[]>(K.addresses, []));
    }
    setReady(true);
  }, []);

  useEffect(() => { if (ready) write(K.cart, cart); }, [cart, ready]);
  useEffect(() => { if (ready) write(K.wishlist, wishlist); }, [wishlist, ready]);
  useEffect(() => { if (ready) write(K.orders, orders); }, [orders, ready]);
  useEffect(() => { if (ready) write(K.addresses, addresses); }, [addresses, ready]);

  const value = useMemo<StoreValue>(() => ({
    ready,
    products: CATALOG,
    getProduct: (id) => CATALOG.find((p) => p.id === id),
    categories: CATEGORIES,
    /**
     * Deterministic sample reviews derived from the product id — a 1:1 port of the HTML
     * edition's `dataService.getReviews()`, so both editions show the same reviews for the
     * same product. Swap for your API in production.
     */
    getReviews: (productId) => {
      const seed = [...productId].reduce((s, c) => s + c.charCodeAt(0), 0);
      const authors = ['Alex M.', 'Sam R.', 'Priya K.', 'Diego L.', 'Noor A.'];
      const titles = ['Great value', 'Highly recommend', 'Exactly as described'];
      return Array.from({ length: 3 }, (_, i) => ({
        id: `${productId}-r${i}`,
        productId,
        author: authors[(seed + i) % authors.length],
        rating: 4 + ((seed + i) % 2),
        date: new Date(Date.UTC(2024, (seed + i) % 12, ((seed * (i + 1)) % 27) + 1)).toISOString(),
        title: titles[(seed + i) % 3],
        body: 'Really happy with this purchase — quality and delivery were both excellent.',
      }));
    },

    cart,
    cartCount: cart.reduce((n, it) => n + it.qty, 0),
    addToCart: (p, qty = 1, variant) => setCart((prev) => {
      const key = variant ? `${p.id}::${variant}` : p.id;
      const existing = prev.find((it) => it.id === key);
      if (existing) {
        return prev.map((it) => it.id === key
          ? { ...it, qty: Math.min(config.commerce.maxQtyPerItem, it.qty + qty) } : it);
      }
      const item: CartItem = {
        id: key, productId: p.id, name: p.name, price: p.price, qty,
        type: p.type, emoji: p.emoji, image: p.image, variant,
      };
      return [...prev, item];
    }),
    updateQty: (id, qty) => setCart((prev) =>
      qty <= 0 ? prev.filter((it) => it.id !== id)
        : prev.map((it) => it.id === id ? { ...it, qty: Math.min(config.commerce.maxQtyPerItem, qty) } : it)),
    removeFromCart: (id) => setCart((prev) => prev.filter((it) => it.id !== id)),
    clearCart: () => setCart([]),

    wishlist,
    isWished: (id) => wishlist.includes(id),
    toggleWishlist: (id) => {
      let now = false;
      setWishlist((prev) => {
        now = !prev.includes(id);
        return now ? [...prev, id] : prev.filter((x) => x !== id);
      });
      return now;
    },

    orders,
    placeOrder: (draft) => {
      const n = orders.length + 1001;
      const order: Order = {
        id: `NV-${n}`, number: `NV-${n}`, createdAt: new Date().toISOString(),
        status: draft.status ?? 'paid', ...draft,
      };
      setOrders((prev) => [order, ...prev]);
      return order;
    },
    /**
     * Patch a stored order (status, tracking, adminNote…) and persist it. The admin order screen
     * writes through this so merchant changes survive a reload — matching the HTML edition's
     * `dataService.updateOrder()`.
     */
    updateOrder: (id, patch) => setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o))),

    addresses,
    saveAddress: (address) => setAddresses((prev) => {
      const exists = prev.some((a) => a.id === address.id);
      let next = exists ? prev.map((a) => (a.id === address.id ? address : a)) : [...prev, address];
      if (address.default) next = next.map((a) => ({ ...a, default: a.id === address.id }));
      else if (!next.some((a) => a.default) && next.length) next = next.map((a, i) => ({ ...a, default: i === 0 }));
      return next;
    }),
    deleteAddress: (id) => setAddresses((prev) => prev.filter((a) => a.id !== id)),
  }), [ready, cart, wishlist, orders, addresses]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within <StoreProvider>');
  return ctx;
}
