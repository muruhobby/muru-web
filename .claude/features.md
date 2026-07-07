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
| `/checkout` | Requires an account (auth gate for guests; carts merge on sign-in) → address form → live courier rates → confirm & pay (see orders.md). |
| `/checkout/processing` | Post-payment landing; polls until the order exists. |
| `/order/[id]` | Order confirmation. |
| `/account`, `/account/addresses`, `/account/orders`, `/account/wishlist` | Customer dashboard — sidebar shell (`account-shell.tsx` via the `(dashboard)` route group layout) around profile settings, address book, order history, and wishlist. |
| `/account/login`, `/account/register` | Auth pages, outside the dashboard shell (see auth.md). |

## Data layer — server catalog vs browser session

Split so pages stay static/cacheable: public catalog data is fetched on the server and
cached; session data (cart, customer, checkout) is fetched **from the browser** straight
against the Medusa store API.

**`lib/data/*` (server, cached)**
- `products.ts` — product/category reads wrapped in `unstable_cache` (5 min revalidate,
  tags `products` / `categories`) since catalog data is public and session-free.
- `collections.ts`, `regions.ts` — collection reads and the single ID region lookup.

**`lib/client/*` (browser)**
- `session.ts` — cart id + pending-order id in `localStorage` (`_medusa_cart_id`,
  `_medusa_order_id`).
- `cart.ts` — get/create cart, add/update/remove line items.
- `checkout.ts` — address + shipping rates, order-first Midtrans payment start, paid
  poll, order retrieval (see orders.md).
- `customer.ts`, `addresses.ts` — auth, profile updates, and address book (see auth.md).
- `orders.ts` — customer order history + the single display status derived per order.
- `wishlist.ts` — product ids stored in the customer's `metadata.wishlist` (no backend
  wishlist module), resolved to priced products for the wishlist page.

**`components/store-provider.tsx`** — client context holding the live cart + customer
(`useStore()`); `cartReady`/`customerReady` gate skeleton states. Session-dependent UI
(header account/cart badge via `header-session.tsx`, `cart-view`, `checkout-view`,
`account-view`, `order-view`) renders client-side inside static page shells, so the
cart/checkout/account routes build as SSG.

## Session state

Browser `localStorage`: `_medusa_cart_id`, `_medusa_order_id` (pending payment), and the
customer JWT (managed by the Medusa SDK). The only cookie is `NEXT_LOCALE` (set by
proxy.ts for locale routing).

## Styling / UI

Tailwind CSS v4 (`@tailwindcss/postcss`), custom tokens like `text-ink`, `bg-paper`,
`text-muted`, `bg-orange`. Product "images" are emoji from product `metadata.emoji` with
📦 fallback. Skeleton loading states in `components/skeletons.tsx` + `loading.tsx` files.

## Environment

See `.env.example`: backend URL, publishable key, display currency. The storefront holds
no payment or shipping secrets — those live in `muru-cms`.
