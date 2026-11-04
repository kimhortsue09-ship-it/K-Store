# Changelog

All notable changes to **Nova Store — Telegram Mini App Store Kit (Next.js edition)** are
documented here. The format follows [Keep a Changelog](https://keepachangelog.com/) and the
project adheres to [Semantic Versioning](https://semver.org/).

## [1.2.0] — 2026-07-24

### Changed
- **Original design pass.** Removed design annotations that tied the styling to another app, and
  changed the default brand accent to Nova indigo (`#5B6CFF`) across light + dark so the identity
  is the kit's own. Replaced the storefront's balance card with a product-led shop hero.
- **Bigger, more realistic catalogue.** Expanded the demo store from 9 to **19 products** with real
  photos across every subcategory. Category product counts are now derived from the actual catalogue
  instead of static numbers.

### Added
- **Full customer-storefront localization.** All shopper-facing pages now render through `t()`, with
  **English, Spanish and Arabic (RTL)** string tables (~426 keys) kept in parity.
- **Accessibility pass.** Form controls are labelled (`id`/`htmlFor` or `aria-label`), icon-only
  buttons carry `aria-label`s, and every clickable element is keyboard-operable (Enter/Space).
- **Working lint setup** — `eslint` + `eslint-config-next` and an `.eslintrc.json`, so `npm run lint`
  runs out of the box.

### Fixed
- Aligned admin demo orders/reviews to real catalogue products (removed phantom items and a product
  name mismatch), neutralised placeholder demo addresses, and removed unused files and a dead export.

## [1.1.0] — 2026-07-23

### Changed
- **New product & category artwork.** Replaced the emoji-on-tile image placeholders with an
  original **vector illustration system** (`src/lib/productArt.ts`): hand-built, gradient-shaded
  illustrations for every demo product (earbuds, watch, phone, jacket, bag, kettle, photo app,
  game controller, e-book) and every category, each on a soft studio backdrop with a floor
  shadow. Still 100% self-contained SVG — no third-party images, fonts or network requests, so
  the kit stays fully resale-safe. Uploaded product images continue to take precedence.
- Product cards, the product-detail gallery (three re-lit angles), trending, categories, cart,
  compare, order and admin lists now all render through this system.

### Added
- **Real demo product photography.** The demo catalogue now ships nine curated, brand/logo-free
  stock photos (in `public/products/`, credited in `public/products/CREDITS.md`) used as the
  primary image for each product, its category tile and the product gallery. Photos are chosen
  from free-licence sources (Pexels / Unsplash) that permit template use. Any product without an
  `image` still falls back to the built-in vector illustration, so buyer-added products stay clean.
- **Shop hero banner** on the storefront home — leads with the featured product's artwork,
  price and discount, so the landing screen reads as a store.

## [1.0.0] — 2026-07-15

Initial release. A complete storefront + admin for Telegram Mini Apps, built with
**Next.js 15 (App Router), React 19, TypeScript and Tailwind CSS**. **77 routes total
(43 storefront + 34 admin).**

### Storefront (43 routes)
- **Shopping:** home, catalog (type/category/subcategory filters + sort), product detail
  (gallery, options/variants, quantity, specs, frequently-bought-together, reviews summary,
  related), product reviews and Q&A, cart (promo codes, summary, recommended), checkout
  (shipping, delivery, payments, terms), order-success, orders (stats + filters), order tracking
  and a guest track-order lookup, search, categories, wishlist (bulk edit).
- **Account:** profile (with avatar chooser), personal-info (photo upload), addresses (CRUD),
  payment-methods (cards + digital wallets), settings (appearance/language/currency/notifications),
  notifications feed, language switcher (RTL-aware), help, about, legal.
- **Extended commerce:** deals, coupons, compare, recently-viewed, gift-cards (buy/redeem with QR),
  rewards (points + tiers), referral, returns, and downloads for digital products — attached files
  and/or download links, plus licence keys. Onboarding, a styled 404, and a component style-guide.
- **Wallet:** balance + quick actions + activity, transactions (filters), transaction detail,
  send, withdraw, payment-request (with QR).

### Admin dashboard (32 sections)
The complete merchant dashboard, dark-only chrome with a slide-up section drawer:
- **Core:** dashboard (clickable KPIs, sales chart, recent orders), orders + order detail
  (status / tracking / notes), a full-page product editor with a multi-image gallery, inventory,
  categories, customers (with loyalty & staff status), analytics (top selling products).
- **Catalog & fulfilment:** collections, digital keys (paste or import a `.txt` of keys), returns,
  abandoned carts, shipping zones.
- **Marketing & loyalty:** marketing, broadcast, discounts, gift cards, loyalty tiers, referrals,
  templates, reviews & Q&A moderation, content/banners.
- **Finance:** payouts, wallets (credit/debit adjustments), transactions, payments, reports.
- **Operations:** support tickets, activity log, staff, integrations, settings.

### Architecture
- **Config-first:** everything a buyer changes lives in one typed `src/config.ts` — brand,
  colours, currency, tax/shipping, promo codes, feature flags, payments, navigation, locale and
  data source.
- **Design tokens + Tailwind:** dark-first palette with a full light theme and a one-tap toggle;
  Tailwind colours map to the same CSS variables.
- **State:** a single `StoreProvider` (cart / wishlist / orders / addresses) persisted to
  `localStorage`, plus a wallet-transactions store, with guarded first-visit demo data.
- **i18n:** file-per-language (`en`, `es`, `ar`), RTL-aware.
- **Payments:** one guarded adapter — Telegram Stars, TON Connect, Stripe and Cash on Delivery —
  with a demo-simulate fallback so checkout completes with no configuration.
- **Telegram:** SSR-safe WebApp adapter with graceful browser fallbacks, so every page is testable
  outside Telegram.
- **Typed end-to-end.** `npm run typecheck` and `npm run build` pass with zero errors.
- Generated SVG placeholder imagery — resale-safe, no third-party assets.

---

<!--
Template for future releases — copy this block above when you ship an update:

## [1.1.0] — YYYY-MM-DD
### Added
- …
### Changed
- …
### Fixed
- …
-->

[1.0.0]: #100--2026-07-15
