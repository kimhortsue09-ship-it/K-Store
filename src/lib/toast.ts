'use client';
/**
 * Nova Kit — transient toast
 * Imperative, SSR-safe port of the HTML kit's `toast()`. Call it from any event handler
 * (no provider needed); it appends a `.toast` to a shared host and auto-dismisses. Styles
 * live in styles/components.css (.toast-host / .toast / .toast--success / .toast--danger).
 */
export type ToastKind = 'default' | 'success' | 'danger';

export function toast(message: string, { kind = 'default', duration = 2600 }: { kind?: ToastKind; duration?: number } = {}): void {
  if (typeof document === 'undefined') return;
  let host = document.getElementById('nova-toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'nova-toast-host';
    host.className = 'toast-host';
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = `toast toast--${kind}`;
  el.setAttribute('role', 'status');
  el.textContent = message;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  setTimeout(() => {
    el.classList.remove('is-in');
    setTimeout(() => el.remove(), 220);
  }, duration);
}
