/**
 * Nova Kit — Product art engine
 * =============================
 * Renders rich, original **vector product illustrations** as self-contained SVG data URIs —
 * zero third-party images, fonts or network requests, so the kit stays 100% resale-safe.
 *
 * Every storefront surface (product cards, the product gallery, trending, categories, the home
 * hero) draws through this module. Each product maps to a hand-built illustration keyed by
 * `product.art` (falling back to a tasteful monogram tile for anything unmapped, so a buyer
 * adding their own products still gets clean art out of the box).
 *
 * To add art for a new product: give the product an `art` id and add a builder to `PRODUCT_ART`.
 * To restyle everything at once: edit `scene()` (backdrop) or the palette helpers below.
 */
import type { Category, Product } from './types';

/* ----------------------------------------------------------------------------------------- *
 * Colour helpers — derive a small palette (base / shade / tint / glow) from one accent hex.  *
 * ----------------------------------------------------------------------------------------- */
type RGB = [number, number, number];
function toRGB(hex: string): RGB {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function toHex([r, g, b]: RGB): string {
  const h = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}
/** Linear blend of two hex colours (t = 0 → a, 1 → b). */
function mix(a: string, b: string, t: number): string {
  const x = toRGB(a), y = toRGB(b);
  return toHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
}
const lighten = (c: string, t: number) => mix(c, '#ffffff', t);
const darken = (c: string, t: number) => mix(c, '#0b1020', t);

interface Pal {
  base: string; light: string; lighter: string; dark: string; darker: string;
  bg1: string; bg2: string; glow: string; ink: string;
}
function palette(color: string): Pal {
  return {
    base: color,
    light: lighten(color, 0.22),
    lighter: lighten(color, 0.42),
    dark: darken(color, 0.20),
    darker: darken(color, 0.38),
    bg1: lighten(color, 0.90),
    bg2: lighten(color, 0.74),
    glow: lighten(color, 0.60),
    ink: darken(color, 0.62),
  };
}

/* ----------------------------------------------------------------------------------------- *
 * Scene wrapper — soft studio backdrop + floor shadow shared by every illustration.          *
 * `variant` (0–2) subtly re-lights the scene so a product's gallery angles look distinct.     *
 * ----------------------------------------------------------------------------------------- */
function scene(obj: string, p: Pal, variant = 0, extraDefs = ''): string {
  const glowX = variant === 1 ? 210 : variant === 2 ? 390 : 300;
  const glowY = variant === 2 ? 250 : 270;
  const gx2 = variant === 1 ? '0.15' : variant === 2 ? '0.85' : '0.5';
  const scale = variant === 1 ? 1.06 : variant === 2 ? 0.92 : 1;
  const dx = variant === 1 ? -6 : variant === 2 ? 10 : 0;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">` +
    `<defs>` +
      `<linearGradient id="bg" x1="${gx2}" y1="0" x2="0.5" y2="1">` +
        `<stop offset="0" stop-color="${p.bg1}"/><stop offset="1" stop-color="${p.bg2}"/>` +
      `</linearGradient>` +
      `<radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">` +
        `<stop offset="0" stop-color="${p.glow}" stop-opacity="0.95"/>` +
        `<stop offset="1" stop-color="${p.glow}" stop-opacity="0"/>` +
      `</radialGradient>` +
      `<linearGradient id="body" x1="0" y1="0" x2="1" y2="1">` +
        `<stop offset="0" stop-color="${p.light}"/><stop offset="0.5" stop-color="${p.base}"/><stop offset="1" stop-color="${p.dark}"/>` +
      `</linearGradient>` +
      `<linearGradient id="bodyV" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0" stop-color="${p.light}"/><stop offset="1" stop-color="${p.dark}"/>` +
      `</linearGradient>` +
      `<linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>` +
      `</linearGradient>` +
      `<filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="10"/></filter>` +
      extraDefs +
    `</defs>` +
    `<rect width="600" height="600" fill="url(#bg)"/>` +
    `<circle cx="${glowX}" cy="${glowY}" r="230" fill="url(#glow)"/>` +
    `<circle cx="86" cy="92" r="60" fill="#ffffff" opacity="0.16"/>` +
    `<circle cx="520" cy="150" r="26" fill="${p.base}" opacity="0.14"/>` +
    `<ellipse cx="300" cy="474" rx="150" ry="30" fill="${p.ink}" opacity="0.16" filter="url(#soft)"/>` +
    `<g transform="translate(${300 + dx} 300) scale(${scale}) translate(-300 -300)">${obj}</g>` +
    `</svg>`
  );
}
const uri = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;

/* ----------------------------------------------------------------------------------------- *
 * Product illustrations. Each receives the derived palette and returns the object group only  *
 * (the scene() wrapper supplies backdrop, glow and floor shadow).                             *
 * ----------------------------------------------------------------------------------------- */
type Build = (p: Pal) => string;

const earbuds: Build = (p) =>
  // Two stemmed earbuds standing in an open charging case (AirPods-style).
  `<g>` +
    // case body + open lid rim
    `<rect x="192" y="356" width="216" height="112" rx="40" fill="url(#bodyV)"/>` +
    `<rect x="192" y="356" width="216" height="34" rx="17" fill="${p.dark}"/>` +
    `<rect x="212" y="366" width="176" height="14" rx="7" fill="${p.darker}"/>` +
    // left earbud
    `<g transform="rotate(-9 264 300)">` +
      `<ellipse cx="264" cy="286" rx="30" ry="34" fill="url(#body)"/>` +
      `<rect x="252" y="300" width="24" height="96" rx="12" fill="url(#bodyV)"/>` +
      `<ellipse cx="256" cy="278" rx="9" ry="12" fill="#ffffff" opacity="0.55"/>` +
      `<circle cx="276" cy="292" r="8" fill="${p.darker}"/>` +
    `</g>` +
    // right earbud
    `<g transform="rotate(9 336 300)">` +
      `<ellipse cx="336" cy="286" rx="30" ry="34" fill="url(#body)"/>` +
      `<rect x="324" y="300" width="24" height="96" rx="12" fill="url(#bodyV)"/>` +
      `<ellipse cx="328" cy="278" rx="9" ry="12" fill="#ffffff" opacity="0.55"/>` +
      `<circle cx="324" cy="292" r="8" fill="${p.darker}"/>` +
    `</g>` +
    `<circle cx="300" cy="440" r="6" fill="${p.lighter}"/>` +
  `</g>`;

const watch: Build = (p) =>
  // Smartwatch, front view, straps top & bottom, a crown, a heart glyph on screen.
  `<g>` +
    `<rect x="270" y="150" width="60" height="70" rx="16" fill="${p.dark}"/>` +
    `<rect x="270" y="380" width="60" height="70" rx="16" fill="${p.dark}"/>` +
    `<rect x="196" y="196" width="208" height="208" rx="52" fill="url(#bodyV)"/>` +
    `<rect x="216" y="216" width="168" height="168" rx="38" fill="${p.ink}"/>` +
    `<rect x="228" y="228" width="144" height="144" rx="30" fill="${darkenScreen(p)}"/>` +
    `<path d="M300 340c-46-28-58-58-40-78 12-14 32-10 40 6 8-16 28-20 40-6 18 20 6 50-40 78z" fill="${p.light}"/>` +
    `<rect x="252" y="248" width="96" height="10" rx="5" fill="#ffffff" opacity="0.55"/>` +
    `<rect x="400" y="272" width="18" height="46" rx="8" fill="${p.dark}"/>` +
    `<rect x="230" y="228" width="44" height="30" rx="14" fill="#ffffff" opacity="0.14"/>` +
  `</g>`;

const phone: Build = (p) =>
  // Smartphone, front view, with a soft wallpaper, notch and a couple of app dots.
  `<g>` +
    `<rect x="216" y="132" width="168" height="336" rx="42" fill="url(#bodyV)"/>` +
    `<rect x="230" y="146" width="140" height="308" rx="32" fill="${p.ink}"/>` +
    `<rect x="242" y="158" width="116" height="284" rx="24" fill="${darkenScreen(p)}"/>` +
    `<rect x="242" y="158" width="116" height="150" rx="24" fill="${p.base}" opacity="0.55"/>` +
    `<circle cx="284" cy="150" r="6" fill="${p.darker}"/><rect x="296" y="146" width="24" height="8" rx="4" fill="${p.darker}"/>` +
    `<rect x="262" y="352" width="34" height="34" rx="10" fill="#ffffff" opacity="0.85"/>` +
    `<rect x="304" y="352" width="34" height="34" rx="10" fill="#ffffff" opacity="0.5"/>` +
    `<rect x="262" y="398" width="34" height="34" rx="10" fill="#ffffff" opacity="0.5"/>` +
    `<rect x="304" y="398" width="34" height="34" rx="10" fill="#ffffff" opacity="0.85"/>` +
    `<rect x="236" y="150" width="30" height="140" rx="16" fill="#ffffff" opacity="0.12"/>` +
  `</g>`;

const jacket: Build = (p) =>
  // Flat-lay field jacket: collar, zip placket, two chest pockets, sleeves.
  `<g>` +
    `<path d="M300 176c-30 0-54 8-84 26l-52 34 40 60 30-20v168c0 8 6 14 14 14h104c8 0 14-6 14-14V276l30 20 40-60-52-34c-30-18-54-26-84-26z" fill="url(#bodyV)"/>` +
    `<path d="M300 176c-16 0-30 3-46 10l46 42 46-42c-16-7-30-10-46-10z" fill="${p.dark}"/>` +
    `<rect x="296" y="228" width="8" height="230" fill="${p.darker}" opacity="0.7"/>` +
    `<g fill="${p.darker}" opacity="0.55"><circle cx="300" cy="262" r="5"/><circle cx="300" cy="300" r="5"/><circle cx="300" cy="338" r="5"/><circle cx="300" cy="376" r="5"/></g>` +
    `<rect x="222" y="330" width="52" height="60" rx="8" fill="${p.dark}"/>` +
    `<rect x="326" y="330" width="52" height="60" rx="8" fill="${p.dark}"/>` +
    `<path d="M300 176c-30 0-54 8-84 26l-52 34 20 30 40-24c22-13 46-20 76-20z" fill="#ffffff" opacity="0.18"/>` +
  `</g>`;

const bag: Build = (p) =>
  // Crossbody bag: rounded body, front flap, strap arc, buckle.
  `<g>` +
    `<path d="M210 250c0-14 12-26 26-26h128c14 0 26 12 26 26v-4c0 54-44 98-90 98s-90-44-90-98z" fill="none" stroke="${p.dark}" stroke-width="16"/>` +
    `<rect x="196" y="286" width="208" height="150" rx="34" fill="url(#bodyV)"/>` +
    `<path d="M196 320c0-19 15-34 34-34h140c19 0 34 15 34 34v26c0 14-11 25-25 25H221c-14 0-25-11-25-25z" fill="${p.dark}"/>` +
    `<rect x="284" y="330" width="32" height="40" rx="8" fill="${p.darker}"/>` +
    `<rect x="290" y="342" width="20" height="16" rx="4" fill="${p.lighter}"/>` +
    `<rect x="220" y="300" width="120" height="12" rx="6" fill="#ffffff" opacity="0.4"/>` +
  `</g>`;

const kettle: Build = (p) =>
  // Electric kettle: rounded body, angled spout (left), C-handle (right), lid + knob, base plate.
  `<g>` +
    `<rect x="230" y="436" width="140" height="22" rx="11" fill="${p.dark}"/>` +
    // handle (behind body, right side)
    `<path d="M372 300c46 6 58 54 30 104" fill="none" stroke="${p.dark}" stroke-width="20" stroke-linecap="round"/>` +
    // body
    `<path d="M256 300h88a20 20 0 0 1 20 19l7 92a26 26 0 0 1-26 28H255a26 26 0 0 1-26-28l7-92a20 20 0 0 1 20-19z" fill="url(#bodyV)"/>` +
    // spout
    `<path d="M256 312l-46-20-10 22 44 24z" fill="${p.dark}"/>` +
    // lid + knob
    `<ellipse cx="300" cy="300" rx="52" ry="15" fill="${p.dark}"/>` +
    `<rect x="284" y="268" width="32" height="24" rx="9" fill="${p.darker}"/>` +
    // gloss
    `<rect x="256" y="326" width="28" height="120" rx="14" fill="#ffffff" opacity="0.32"/>` +
    // power indicator
    `<circle cx="330" cy="408" r="7" fill="${p.lighter}"/>` +
  `</g>`;

const app: Build = (p) =>
  // Photo-editing app: a framed photo (sun + mountains) with an edit slider — creative suite.
  `<g>` +
    `<rect x="176" y="180" width="248" height="240" rx="36" fill="url(#bodyV)"/>` +
    `<rect x="196" y="200" width="208" height="160" rx="18" fill="${lighten(p.base, 0.8)}"/>` +
    `<circle cx="256" cy="248" r="20" fill="${p.lighter}"/>` +
    `<path d="M196 360v-40l52-52 46 46 40-34 70 64v16z" fill="${p.base}"/>` +
    `<path d="M196 360v-16l70-64 40 34-58 46z" fill="${p.dark}"/>` +
    `<circle cx="300" cy="392" r="14" fill="${p.darker}"/>` +
    `<rect x="212" y="386" width="72" height="12" rx="6" fill="${p.lighter}"/>` +
    `<rect x="316" y="386" width="72" height="12" rx="6" fill="${p.lighter}"/>` +
    `<rect x="196" y="200" width="208" height="60" rx="18" fill="#ffffff" opacity="0.18"/>` +
  `</g>`;

const game: Build = (p) =>
  // Game controller: body, two grips, d-pad, four buttons, twin sticks.
  `<g>` +
    `<path d="M214 268c40-16 132-16 172 0 30 12 44 60 40 108-3 34-40 40-60 16l-26-32c-8-10-18-14-30-14h-34c-12 0-22 4-30 14l-26 32c-20 24-57 18-60-16-4-48 10-96 40-108z" fill="url(#bodyV)"/>` +
    `<rect x="236" y="300" width="16" height="52" rx="8" fill="${p.darker}"/>` +
    `<rect x="212" y="318" width="52" height="16" rx="8" fill="${p.darker}"/>` +
    `<circle cx="356" cy="312" r="11" fill="${p.lighter}"/><circle cx="384" cy="336" r="11" fill="${p.lighter}"/>` +
    `<circle cx="384" cy="288" r="11" fill="${p.lighter}"/><circle cx="330" cy="336" r="11" fill="${p.lighter}"/>` +
    `<circle cx="286" cy="372" r="22" fill="${p.dark}"/><circle cx="286" cy="372" r="12" fill="${p.darker}"/>` +
    `<circle cx="330" cy="372" r="22" fill="${p.dark}"/><circle cx="330" cy="372" r="12" fill="${p.darker}"/>` +
    `<path d="M236 292c34-12 94-12 128 0" stroke="#ffffff" stroke-opacity="0.35" stroke-width="10" fill="none" stroke-linecap="round"/>` +
  `</g>`;

const book: Build = (p) =>
  // Standing hardcover book at a slight angle: cover, spine, page edge, title lines.
  `<g>` +
    `<path d="M226 190l150-24v250l-150 24z" fill="url(#body)"/>` +
    `<path d="M226 190l150-24 12 22-150 24z" fill="${p.light}"/>` +
    `<path d="M376 166l14 8v246l-14 22z" fill="${p.dark}"/>` +
    `<path d="M238 210l118-19" stroke="#ffffff" stroke-opacity="0.7" stroke-width="10" stroke-linecap="round"/>` +
    `<path d="M238 240l90-14" stroke="#ffffff" stroke-opacity="0.45" stroke-width="8" stroke-linecap="round"/>` +
    `<path d="M238 262l70-11" stroke="#ffffff" stroke-opacity="0.45" stroke-width="8" stroke-linecap="round"/>` +
    `<path d="M226 190l-14 10v250l14-10z" fill="${p.darker}"/>` +
    `<path d="M212 200l14-10v250l-14 10z" fill="${lighten(p.base, 0.85)}"/>` +
    `<path d="M300 330l16 22 26-40" stroke="#ffffff" stroke-opacity="0.85" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
  `</g>`;

/** Slightly desaturated near-ink used for device screens (keeps them from going pure black). */
function darkenScreen(p: Pal): string { return darken(p.base, 0.72); }

const PRODUCT_ART: Record<string, Build> = {
  earbuds, watch, phone, jacket, bag, kettle, app, game, book,
};
/** Sensible default hue per illustration, so inputs without a `color` (cart/order lines) still look right. */
const ART_COLOR: Record<string, string> = {
  earbuds: '#5B6CFF', watch: '#1FB57A', phone: '#3AA0FF', jacket: '#F5A524',
  bag: '#F0416C', kettle: '#8B5CF6', app: '#5B6CFF', game: '#1FB57A', book: '#3AA0FF',
};

/** Anything product-shaped this engine can draw from — real Products, cart/order lines, admin drafts. */
export interface ArtInput {
  id?: string; productId?: string; name?: string;
  color?: string; art?: string; image?: string;
}

/** Map an input to its art id — explicit `art`, else inferred from id / productId / name keywords. */
function artKey(input: ArtInput): string {
  const explicit = input.art;
  if (explicit && PRODUCT_ART[explicit]) return explicit;
  const s = `${input.art ?? ''} ${input.id ?? ''} ${input.productId ?? ''} ${input.name ?? ''}`.toLowerCase();
  if (s.includes('bud') || s.includes('audio') || s.includes('earphone')) return 'earbuds';
  if (s.includes('watch')) return 'watch';
  if (s.includes('phone')) return 'phone';
  if (s.includes('jacket')) return 'jacket';
  if (s.includes('bag')) return 'bag';
  if (s.includes('kettle')) return 'kettle';
  if (s.includes('photo') || s.includes('suite')) return 'app';
  if (s.includes('run') || s.includes('game')) return 'game';
  if (s.includes('craft') || s.includes('guide') || s.includes('book')) return 'book';
  return '';
}

/** Tasteful monogram fallback so unmapped products still render clean, non-emoji art. */
function monogram(product: { name?: string }, p: Pal): string {
  const ch = ((product.name ?? 'N').trim()[0] || 'N').toUpperCase();
  return (
    `<g>` +
    `<rect x="188" y="188" width="224" height="224" rx="52" fill="url(#body)"/>` +
    `<rect x="188" y="188" width="224" height="112" rx="52" fill="#ffffff" opacity="0.14"/>` +
    `<text x="300" y="300" font-family="-apple-system,Segoe UI,Roboto,sans-serif" font-size="150" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${ch}</text>` +
    `</g>`
  );
}

/**
 * Rich product illustration as an SVG data URI. A real uploaded `image` passes through
 * unchanged, so buyer/admin uploads always win over the generated art.
 * @param variant 0–2 — re-lights the scene so gallery angles look distinct.
 */
export function productArt(input: ArtInput, variant = 0): string {
  if (input.image) return input.image;
  const key = artKey(input);
  const p = palette(input.color || ART_COLOR[key] || '#5B6CFF');
  const build = PRODUCT_ART[key];
  const obj = build ? build(p) : monogram(input, p);
  return uri(scene(obj, p, variant));
}

/* ----------------------------------------------------------------------------------------- *
 * Category illustrations — one clean glyph per category, same studio backdrop.                *
 * ----------------------------------------------------------------------------------------- */
const CATEGORY_COLORS: Record<string, string> = {
  electronics: '#3AA0FF', fashion: '#F0416C', home: '#1FB57A',
  software: '#5B6CFF', ebooks: '#F5A524',
};
const CATEGORY_ART: Record<string, Build> = {
  electronics: (p) =>
    `<g><rect x="230" y="176" width="140" height="248" rx="30" fill="url(#bodyV)"/>` +
    `<rect x="244" y="196" width="112" height="196" rx="18" fill="${darkenScreen(p)}"/>` +
    `<rect x="244" y="196" width="112" height="90" rx="18" fill="${p.base}" opacity="0.6"/>` +
    `<rect x="278" y="404" width="44" height="8" rx="4" fill="${p.darker}"/></g>`,
  fashion: (p) =>
    `<g><path d="M300 196l58 22 54 40-34 46-30-18v146c0 8-6 14-14 14h-66c-8 0-14-6-14-14V286l-30 18-34-46 54-40z" fill="url(#bodyV)"/>` +
    `<path d="M300 196c-16 0-30 10-30 24 0 12 14 22 30 22s30-10 30-22c0-14-14-24-30-24z" fill="${p.dark}"/></g>`,
  home: (p) =>
    `<g><path d="M300 176l150 120-26 32-14-11v130c0 9-7 16-16 16H206c-9 0-16-7-16-16V317l-14 11-26-32z" fill="url(#bodyV)"/>` +
    `<rect x="266" y="360" width="68" height="103" rx="8" fill="${p.dark}"/>` +
    `<rect x="220" y="330" width="46" height="46" rx="8" fill="${p.darker}"/></g>`,
  software: (p) =>
    `<g><rect x="176" y="200" width="248" height="200" rx="28" fill="url(#bodyV)"/>` +
    `<rect x="176" y="200" width="248" height="46" rx="28" fill="${p.dark}"/>` +
    `<circle cx="204" cy="223" r="7" fill="${p.lighter}"/><circle cx="228" cy="223" r="7" fill="${p.lighter}"/><circle cx="252" cy="223" r="7" fill="${p.lighter}"/>` +
    `<path d="M258 296l-30 30 30 30" stroke="#ffffff" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M342 296l30 30-30 30" stroke="#ffffff" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`,
  ebooks: (p) =>
    `<g><rect x="196" y="320" width="208" height="40" rx="8" fill="${p.dark}" transform="rotate(-4 300 340)"/>` +
    `<rect x="200" y="272" width="200" height="40" rx="8" fill="${p.base}" transform="rotate(3 300 292)"/>` +
    `<rect x="204" y="224" width="192" height="40" rx="8" fill="${p.light}" transform="rotate(-2 300 244)"/>` +
    `<rect x="226" y="232" width="120" height="8" rx="4" fill="#ffffff" opacity="0.6" transform="rotate(-2 300 236)"/></g>`,
};

/**
 * Optional real cover photo per category (reuses the bundled product photos, so category tiles
 * match the catalogue). Delete an entry to fall back to that category's vector illustration.
 */
const CATEGORY_IMAGE: Record<string, string> = {
  electronics: '/products/phone.jpg',
  fashion: '/products/bag.jpg',
  home: '/products/kettle.jpg',
  software: '/products/app.jpg',
  ebooks: '/products/book.jpg',
};

export function categoryArt(category: Category): string {
  const photo = CATEGORY_IMAGE[category.id];
  if (photo) return photo;
  const color = CATEGORY_COLORS[category.id] || '#5B6CFF';
  const p = palette(color);
  const build = CATEGORY_ART[category.id];
  const obj = build ? build(p) : monogram({ name: category.name } as Product, p);
  return uri(scene(obj, p, 0));
}

export default productArt;
