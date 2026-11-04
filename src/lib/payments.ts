/**
 * Nova Kit — Payments adapter
 * One guarded entry point for every rail (Telegram Stars, TON Connect, Stripe, manual),
 * driven by config.payments. Leave a provider's fields blank to run in demo mode: with
 * demoSimulate:true an unconfigured rail resolves a simulated success so checkout always
 * completes. Only publishable values/endpoints belong here — keep secrets on your server.
 */
import { config } from '@/config';
import type { Order, PaymentMethod, PaymentResult } from './types';
import { isTelegram, openInvoice } from './telegram';

const P = () => config.payments;
const providerCfg = <K extends keyof typeof config.payments.providers>(id: K) => config.payments.providers[id];

export function enabledMethods(country?: string): PaymentMethod[] {
  return P().methods.filter((m) => {
    if (!m.enabled) return false;
    const prov = P().providers[m.provider as keyof typeof config.payments.providers] as { enabled?: boolean } | undefined;
    if (prov && prov.enabled === false) return false;
    if (m.provider === 'stripe' && country) {
      const list = providerCfg('stripe').supportedCountries;
      if (list.length && !list.includes(country)) return false;
    }
    return true;
  });
}

export const methodById = (id: string): PaymentMethod | undefined => P().methods.find((m) => m.id === id);

export const toStars = (amount: number): number =>
  Math.max(1, Math.round(amount * (providerCfg('telegramStars').starsPerUnit || 0)));

export const toTon = (amount: number): number =>
  Math.round(amount * (providerCfg('tonConnect').tonPerUnit || 0) * 1e4) / 1e4;

function simulated(provider: string, extra: Partial<PaymentResult> = {}): PaymentResult {
  return {
    status: 'paid', provider, simulated: true,
    reference: provider.slice(0, 3).toUpperCase() + '-' + Math.abs(Date.now() % 0xffffff).toString(36).toUpperCase(),
    ...extra,
  };
}

export interface PayArgs {
  method: PaymentMethod | string;
  amount: number;
  currency?: string;
  description?: string;
  order?: Order | null;
}

export async function pay({ method, amount, currency = config.currency.code, description = '', order = null }: PayArgs): Promise<PaymentResult> {
  const m = typeof method === 'string' ? methodById(method) : method;
  if (!m) throw new Error('Unknown payment method');
  try {
    switch (m.provider) {
      case 'telegramStars': return await payStars(amount, order, description);
      case 'tonConnect': return await payTon(amount);
      case 'stripe': return await payStripe(amount, currency, order);
      case 'manual': return { status: 'pending', provider: 'manual', reference: null };
      default:
        if (P().demoSimulate) return simulated(m.provider);
        throw new Error(`No handler for provider "${m.provider}"`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (P().demoSimulate) return simulated(m.provider, { note: `demo fallback (${msg})` });
    return { status: 'failed', provider: m.provider, error: msg };
  }
}

async function payStars(amount: number, order: Order | null, description: string): Promise<PaymentResult> {
  const cfg = providerCfg('telegramStars');
  const stars = toStars(amount);
  let link = '';
  if (cfg.createInvoiceUrl) {
    const res = await fetch(cfg.createInvoiceUrl, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order, amount, stars, currency: 'XTR', description }),
    });
    if (!res.ok) throw new Error(`invoice endpoint ${res.status}`);
    link = ((await res.json()) as { invoiceLink?: string }).invoiceLink ?? '';
  }
  if (link && isTelegram()) {
    const status = await openInvoice(link);
    if (status === 'paid') return { status: 'paid', provider: 'telegramStars', stars, reference: link };
    if (status === 'pending') return { status: 'pending', provider: 'telegramStars', stars };
    throw new Error(`invoice ${status}`);
  }
  if (P().demoSimulate) return simulated('telegramStars', { stars });
  throw new Error('Telegram Stars not configured');
}

interface TonConnectUiCtor {
  new (opts: { manifestUrl: string }): {
    account?: unknown;
    connectWallet(): Promise<void>;
    sendTransaction(tx: { validUntil: number; messages: { address: string; amount: string }[] }): Promise<{ boc?: string }>;
  };
}

async function payTon(amount: number): Promise<PaymentResult> {
  const cfg = providerCfg('tonConnect');
  const ton = toTon(amount);
  const nano = String(Math.round(ton * 1e9));
  const TC = (globalThis as { TON_CONNECT_UI?: { TonConnectUI: TonConnectUiCtor } }).TON_CONNECT_UI;
  if (TC && cfg.manifestUrl && cfg.recipientAddress) {
    const g = globalThis as { __novaTonUI?: InstanceType<TonConnectUiCtor> };
    const ui = g.__novaTonUI ?? (g.__novaTonUI = new TC.TonConnectUI({ manifestUrl: cfg.manifestUrl }));
    if (!ui.account) await ui.connectWallet();
    const result = await ui.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + (cfg.validSeconds || 600),
      messages: [{ address: cfg.recipientAddress, amount: nano }],
    });
    return { status: 'paid', provider: 'tonConnect', ton, reference: result?.boc ?? null };
  }
  if (P().demoSimulate) return simulated('tonConnect', { ton });
  throw new Error('TON Connect not configured');
}

async function payStripe(amount: number, currency: string, order: Order | null): Promise<PaymentResult> {
  const cfg = providerCfg('stripe');
  const stash = () => write(`${config.data.persistNamespace}:pendingOrder`, order);
  if (cfg.mode === 'paymentLink' && cfg.paymentLinkUrl) {
    stash(); redirect(cfg.paymentLinkUrl);
    return { status: 'redirect', provider: 'stripe' };
  }
  if (cfg.mode === 'checkout' && cfg.checkoutUrl) {
    const res = await fetch(cfg.checkoutUrl, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order, amount, currency }),
    });
    if (!res.ok) throw new Error(`checkout endpoint ${res.status}`);
    const url = ((await res.json()) as { url?: string }).url;
    if (!url) throw new Error('no checkout url returned');
    stash(); redirect(url);
    return { status: 'redirect', provider: 'stripe' };
  }
  if (P().demoSimulate) return simulated('stripe');
  throw new Error('Stripe not configured');
}

function write(key: string, value: unknown) {
  if (typeof window !== 'undefined') {
    try { window.localStorage.setItem(key, JSON.stringify(value ?? {})); } catch { /* ignore */ }
  }
}
function redirect(url: string) {
  if (typeof window !== 'undefined') window.location.href = url;
}
