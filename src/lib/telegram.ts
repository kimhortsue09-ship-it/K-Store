/**
 * Nova Kit — Telegram WebApp adapter
 * The ONLY place that touches window.Telegram.WebApp. Every call is guarded and SSR-safe,
 * so components work identically inside Telegram and in a plain browser (where these become
 * no-ops or sensible fallbacks). Use these helpers — never the SDK directly.
 */
import { config } from '@/config';

type HapticKind = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

/* Minimal shape of the bits of the Telegram WebApp SDK we use. */
interface TelegramWebApp {
  ready(): void;
  expand(): void;
  close(): void;
  version?: string;
  isVersionAtLeast?(v: string): boolean;
  enableClosingConfirmation?(): void;
  colorScheme?: 'light' | 'dark';
  themeParams?: Record<string, string>;
  initDataUnsafe?: { user?: { id: number; first_name?: string; last_name?: string; username?: string } };
  HapticFeedback?: {
    impactOccurred(style: string): void;
    notificationOccurred(type: string): void;
    selectionChanged(): void;
  };
  BackButton?: { show(): void; hide(): void; onClick(cb: () => void): void };
  showAlert?(msg: string, cb?: () => void): void;
  showConfirm?(msg: string, cb: (ok: boolean) => void): void;
  openInvoice?(url: string, cb: (status: string) => void): void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

function wa(): TelegramWebApp | null {
  if (typeof window === 'undefined' || !config.telegram.enabled) return null;
  return window.Telegram?.WebApp ?? null;
}

/**
 * Is the running Telegram client at least Bot API version `min` (e.g. '6.2')?
 * Older clients still expose newer methods (showAlert, openInvoice, HapticFeedback…) but calling
 * them only logs "Method X is not supported in version 6.0" and never fires their callback — so we
 * must feature-detect by VERSION, not by method presence, and fall back to a browser equivalent.
 * `isVersionAtLeast` itself only exists on 6.7+, so we also parse `version` manually for old clients.
 */
function atLeast(app: TelegramWebApp | null, min: string): boolean {
  if (!app) return false;
  if (typeof app.isVersionAtLeast === 'function') {
    try { return app.isVersionAtLeast(min); } catch { /* fall through to manual parse */ }
  }
  const parse = (v: string) => v.split('.').map((n) => parseInt(n, 10) || 0);
  const cur = parse(app.version ?? '6.0');
  const want = parse(min);
  for (let i = 0; i < Math.max(cur.length, want.length); i++) {
    const c = cur[i] ?? 0, w = want[i] ?? 0;
    if (c !== w) return c > w;
  }
  return true;
}

export const isTelegram = (): boolean => Boolean(wa());

export function initTelegram(): void {
  const app = wa();
  if (!app) return;
  app.ready();
  if (config.telegram.expand) app.expand();
  if (config.telegram.closingConfirmation && atLeast(app, '6.2')) app.enableClosingConfirmation?.();
}

export function telegramColorScheme(): 'light' | 'dark' | null {
  return wa()?.colorScheme ?? null;
}

export function telegramUser() {
  return wa()?.initDataUnsafe?.user ?? null;
}

export function haptic(kind: HapticKind = 'light'): void {
  const app = wa();
  const h = app?.HapticFeedback;
  // HapticFeedback requires Bot API 6.1+ — calling it on older clients just logs a warning.
  if (!h || !config.telegram.haptics || !atLeast(app, '6.1')) return;
  if (kind === 'success' || kind === 'warning' || kind === 'error') h.notificationOccurred(kind);
  else if (kind === 'selection') h.selectionChanged();
  else h.impactOccurred(kind);
}

export function tgAlert(message: string): Promise<void> {
  const app = wa();
  return new Promise((resolve) => {
    // showAlert needs Bot API 6.2+. On older clients the method exists but never fires its
    // callback (only logs "not supported"), which would hang this promise — so fall back.
    if (app?.showAlert && atLeast(app, '6.2')) app.showAlert(message, () => resolve());
    else {
      if (typeof window !== 'undefined') window.alert(message);
      resolve();
    }
  });
}

export function tgConfirm(message: string): Promise<boolean> {
  const app = wa();
  return new Promise((resolve) => {
    // showConfirm needs Bot API 6.2+ — same hang risk as showAlert on older clients.
    if (app?.showConfirm && atLeast(app, '6.2')) app.showConfirm(message, (ok) => resolve(ok));
    else resolve(typeof window !== 'undefined' ? window.confirm(message) : false);
  });
}

export function openInvoice(link: string): Promise<string> {
  const app = wa();
  return new Promise((resolve) => {
    // openInvoice needs Bot API 6.1+.
    if (app?.openInvoice && atLeast(app, '6.1')) app.openInvoice(link, (status) => resolve(status));
    else resolve('unsupported');
  });
}

export function closeApp(): void {
  wa()?.close();
}
