# muru-web — feature map

Next.js 16 storefront for Muru Hobby, an Indonesian hobby shop. Talks to the Medusa v2
backend (`muru-cms`, sibling repo) through `@medusajs/js-sdk` (`lib/medusa.ts`) using a
publishable API key. All money is IDR (`formatIDR` in `lib/util.ts`).

Deeper dives live next to this file: [auth.md](auth.md), [roles.md](roles.md),
[orders.md](orders.md), and [order-to-payment.md](order-to-payment.md) (detailed
cross-repo payment lifecycle). Payment integration details: `docs/payments-midtrans.md`.

> Heed the repo's AGENTS.md: this Next.js version has breaking changes — check
> `node_modules/next/dist/docs/` before writing Next-specific code.

## Routing & i18n

- Every page lives under `app/[lang]/…` with locales `en` and `id` (`lib/i18n/config.ts`).
- `proxy.ts` (Next's middleware-equivalent here) redirects locale-less URLs to
  `/{locale}/…`, choosing from the `NEXT_LOCALE` cookie, then `Accept-Language`, then `en`.
  It skips `_next`, `api`, and file-extension paths.
- Dictionaries are `lib/i18n/en.json` / `id.json`; server pages load them via
  `getDictionary(lang)`, client components read them from `I18nProvider`
  (`components/i18n-provider.tsx`). `interpolate()` fills `{placeholders}`.
- `LocalizedLink` / `localePath` keep links locale-prefixed; `locale-switcher.tsx` swaps.

## Pages

| Route | What it does |
| --- | --- |
| `/` | Home: hero, category tiles, featured products. |
| `/shop`, `/category/[handle]`, `/collection/[handle]` | Catalog listings. |
| `/search` | Product search (`q` param → Medusa `q` filter). |
| `/product/[handle]` | Product detail; variant picker (`product-purchase.tsx`). |
| `/cart` | Cart lines, quantity edit/remove. |
| `/checkout` | Address form → live courier rates → confirm & pay (see orders.md). |
| `/checkout/processing` | Post-payment landing; polls until the order exists. |
| `/order/[id]` | Order confirmation. |
| `/account`, `/account/login`, `/account/register`, `/account/addresses` | Customer area (see auth.md). |

## Data layer (`lib/data/*`)

Server-only modules. Mutations are `"use server"` actions; catalog reads are cached.

- `products.ts` — product/category reads wrapped in `unstable_cache` (5 min revalidate,
  tags `products` / `categories`) since catalog data is public and cookie-free.
- `collections.ts`, `regions.ts` — collection reads and the single ID region lookup.
- `cart.ts` — get/create cart (cart id in a cookie), add/update/remove line items;
  revalidates the layout so the header badge updates.
- `checkout.ts` — address + shipping rates, Midtrans payment start, payment status poll,
  order retrieval (see orders.md).
- `customer.ts`, `addresses.ts` — auth and address book (see auth.md).

## Session cookies (`lib/cookies.ts`)

All httpOnly, SameSite=Lax, 1-week: `_medusa_jwt` (customer JWT), `_medusa_cart_id`
(active cart). Plus `NEXT_LOCALE` (set by proxy.ts, readable client-side).

## Styling / UI

Tailwind CSS v4 (`@tailwindcss/postcss`), custom tokens like `text-ink`, `bg-paper`,
`text-muted`, `bg-orange`. Product "images" are emoji from product `metadata.emoji` with
📦 fallback. Skeleton loading states in `components/skeletons.tsx` + `loading.tsx` files.

## Environment

See `.env.example`: backend URL, publishable key, display currency. The storefront holds
no payment or shipping secrets — those live in `muru-cms`.
