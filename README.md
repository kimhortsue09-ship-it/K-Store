<div align="center">

![Nova Store — Telegram Mini App eCommerce UI Kit (Next.js edition)](.github/banner.png)

# Nova Store — Telegram Mini App eCommerce UI Kit (Next.js edition)

**A complete storefront + admin panel for a Telegram Mini App, built with Next.js 15, React 19, TypeScript and Tailwind CSS.**
Config-first. Fully typed. Zero external UI dependencies.

[![Stars](https://img.shields.io/github/stars/unusdon/nova-store-telegram-mini-app-nextjs?style=social)](https://github.com/unusdon/nova-store-telegram-mini-app-nextjs)
&nbsp;·&nbsp; Light + Dark &nbsp;·&nbsp; EN · ES · AR (RTL) &nbsp;·&nbsp; Telegram-native

### ⭐ If this saves you time, **star the repo** — it genuinely helps.

**Prefer no build step?** &nbsp;→&nbsp; **[The vanilla HTML/CSS/JS edition is here](https://github.com/unusdon/nova-store-telegram-mini-app)** — same design, no framework, no bundler, opens in a browser.

</div>

---

## What this is

A production-shaped **UI kit** for a Telegram Mini App store — Telegram-native palette (white + blue,
dark on the toggle), typed end-to-end, wired to a `localStorage` demo layer so the whole thing is
clickable out of the box. Connect your own API and payment keys for production.

> **It's a front-end kit, not a hosted backend.** Payments run through provider *adapters*
> (Telegram Stars · TON · Stripe · Cash on Delivery) that simulate in demo mode; drop in your own
> endpoints/keys to go live.

## ✨ Features

- **77 routes total** — 43 storefront + 34-page admin dashboard
- **Config-first** — one typed `src/config.ts` re-skins & re-scopes the whole app (brand, currency, tax/shipping, promo codes, payments, nav, locale, data source)
- **Fully typed** — `npm run typecheck` and `npm run build` pass with zero errors
- **Light + Dark** themes, Telegram-native palette, one-tap toggle via `data-theme`
- **3 languages** — English · Spanish · Arabic, with full **RTL**
- **Digital + physical products** — downloads, license keys, variants
- **4 payment rails** — Telegram Stars · TON · Stripe · Cash on Delivery (adapter pattern)
- **Full admin** — dashboard, analytics, orders, products, customers, loyalty, discounts, and more
- **Static export ready** — flip `output: 'export'` in `next.config.mjs` and upload the `out/` folder to any HTTPS host

## ▶ Run it locally

```bash
npm install
npm run dev          # http://localhost:8001
```

Other scripts:

```bash
npm run build        # production build
npm run start        # serve the production build
npm run typecheck    # tsc --noEmit
npm run lint         # next lint
```

**Requirements:** Node.js 18.18+ (or 20+) and npm. To go live on Telegram you need an **HTTPS** host
and a bot from [@BotFather](https://t.me/BotFather).

## 🌐 Live demo

**[View the live demo →](https://nova-store-telegram-mini-app.netlify.app)** &nbsp;·&nbsp; [admin dashboard →](https://nova-store-telegram-mini-app.netlify.app/admin/)

<sub>_Same design as the Next.js build — the vanilla edition is deployed on Netlify. On desktop it renders as a centred phone; on a real device it fills the screen. Sample data runs in the browser (localStorage) — connect your own API & keys for production._</sub>

![Admin dashboard](.github/banner-admin.png)

## 🛠 Make it yours

Almost everything is controlled from two files:

- **`src/config.ts`** — brand, colours, currency, tax/shipping, promo codes, feature flags,
  payments, navigation, locale and data source. Fully typed via `src/lib/types.ts`.
- **`app/globals.css`** — the design tokens (light on `:root`, dark on
  `:root[data-theme="dark"]`). Tailwind colours reference these variables, so the light/dark
  toggle just swaps one attribute.

**Add a language:** copy `src/lib/locales/en.ts` to `xx.ts`, translate the values, import it in
`src/lib/i18n.ts`, and add `'xx'` to `config.locale.available` (and `rtlLocales` if RTL).

**Product images:** each demo product sets an `image` in `src/data/catalog.ts` pointing at a photo
in `public/products/` (credited in `public/products/CREDITS.md`). Swap those for your own product
photography, or point `config.data.source` at your API. Any product **without** an `image` is
rendered by the built-in vector illustration engine (`src/lib/productArt.ts`) — original,
self-contained SVG with no external assets — so newly added products always look clean.

## 🧩 How it's built

- **Client-first.** A Telegram Mini App is authenticated by Telegram `initData` and is highly
  interactive, so pages that use state are Client Components (`'use client'`). The Telegram
  adapter is SSR-safe (guards on `window`), so the app still renders on the server.
- **State** lives in one `StoreProvider` (`src/lib/store.tsx`), persisted to `localStorage`
  under `config.data.persistNamespace`. Swap the read helpers for `fetch()` calls to use your
  API (`config.data.source = 'api'`).
- **Payments** all flow through `src/lib/payments.ts`; unconfigured rails simulate success in
  demo mode so checkout completes with zero setup.

## 🚀 Deploying to Telegram

Build a production app (`npm run build && npm run start`) behind HTTPS, or flip `output: 'export'`
in `next.config.mjs` for a fully static export you can upload to any HTTPS host, then register the
URL with @BotFather (`/newapp`).

## Two editions

| | **[Vanilla edition](https://github.com/unusdon/nova-store-telegram-mini-app)** | **This repo (Next.js edition)** |
|---|---|---|
| Stack | HTML · CSS · vanilla JS | **Next.js 15 · React 19 · TypeScript · Tailwind** |
| Build step | None | Standard Next.js |
| Type safety | — | ✅ Fully typed |
| Architecture | Per-page controllers | Components, hooks, config-first |
| Admin | 34 pages | 34 pages |
| Static export | manual | ✅ `output: 'export'` ready |

Both are free. Pick the one that matches your stack.

## License

See [`LICENSE`](LICENSE). Free to use and build your own store on top of; **redistribution or resale
of this kit (or a derivative) as a template/theme is not permitted.** Building your own
product/store with it is exactly what it's for.

---

<div align="center">
<sub>Built by <b><a href="https://github.com/unusdon">unusdon</a></b> — senior software engineer, 21+ years shipping web, mobile, AI &amp; cloud. &nbsp;·&nbsp; If it helped, leave a ⭐.</sub>
</div>
