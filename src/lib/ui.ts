/**
 * Nova Kit — small UI utilities
 */

/** Merge class names, dropping falsy values. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Generate a decorative QR-style SVG (data URI) from any string. This is a visual
 * placeholder (deterministic pattern + finder squares) — swap in a real QR library if you
 * need scannable codes. Ships no dependencies and no external requests.
 * Ported 1:1 from the HTML edition's `assets/js/core/ui.js`.
 */
export function qr(text: string, modules = 25): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const finder = (x: number, y: number, bx: number, by: number): number | null => {
    const rx = x - bx, ry = y - by;
    if (rx < 0 || ry < 0 || rx > 6 || ry > 6) return null;
    return rx === 0 || ry === 0 || rx === 6 || ry === 6 || (rx >= 2 && rx <= 4 && ry >= 2 && ry <= 4) ? 1 : 0;
  };
  const m = 6;
  let rects = '';
  for (let y = 0; y < modules; y++) {
    for (let x = 0; x < modules; x++) {
      let on = finder(x, y, 0, 0);
      if (on === null) on = finder(x, y, modules - 7, 0);
      if (on === null) on = finder(x, y, 0, modules - 7);
      if (on === null) {
        h = (Math.imul(h, 1103515245) + 12345) >>> 0;
        on = (h >>> 17) & 1;
      }
      if (on) rects += `<rect x="${x * m}" y="${y * m}" width="${m}" height="${m}"/>`;
    }
  }
  const px = modules * m;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}">` +
    `<rect width="${px}" height="${px}" fill="#fff"/><g fill="#000">${rects}</g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Generate a self-contained SVG placeholder image (emoji on a coloured tile) as a data URI. */
export function placeholder(emoji = '📦', color = '#5B6CFF', w = 600, h = 600): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>` +
    `<rect width='100%' height='100%' fill='${color}'/>` +
    `<text x='50%' y='50%' font-size='${Math.round(w * 0.42)}' text-anchor='middle' dominant-baseline='central'>${emoji}</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
