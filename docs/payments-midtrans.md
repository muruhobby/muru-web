# Midtrans Payment (Snap redirect, Medusa provider)

How checkout payment works, configured as a **Medusa payment provider** in the backend
(`muru-cms`) with the storefront (`muru-web`) using the standard payment-session flow.

## Overview

Payment uses **Midtrans Snap** in **redirect** mode. After the customer calculates shipping and
picks a courier, they confirm and are sent to Midtrans' hosted payment page. The **Medusa order
is created only after Midtrans confirms payment**, driven by the **webhook** — so it works even
if the customer closes the tab or pays later by **QRIS / virtual account**.

Because this is a real Medusa payment provider (`pp_midtrans_midtrans`), Medusa records the
actual captured payment and supports **refunds from the admin** — unlike a storefront-only
integration.

## Flow

```
muru-web: Confirm & pay
  → initiatePaymentSession(cart, "pp_midtrans_midtrans")
      → [muru-cms] provider.initiatePayment(): Snap create (SERVER KEY)
        → returns redirect_url in the payment session `data`
  → storefront redirects customer to Midtrans hosted page
  → customer pays (card instantly / QRIS-VA later)
       ├─ Midtrans webhook → POST /hooks/payment/midtrans_midtrans   [muru-cms, built-in]
       │     provider.getWebhookActionAndData() verifies signature → SUCCESSFUL
       │     → processPaymentWorkflow authorizes + captures + completes cart → ORDER
       └─ Midtrans redirect → muru-web /checkout/processing  ("processing" + Verify button)
             Verify/poll → checkPaymentStatus() → GET /store/checkout/status?cart_id [muru-cms]
                            → { order_id } once the webhook created it
             order_id → clear cart cookie → /order/[id]
Admin refund → provider.refundPayment() → Midtrans refund API
```

The **webhook is the source of truth**; the processing page's **Verify payment** button + light
auto-poll just check whether the order exists yet (read-only), which matters for QRIS/VA that
settle minutes/hours later.

## Key files

**Backend (`muru-cms`)**
| File | Role |
| --- | --- |
| `src/modules/midtrans/client.ts` | Snap create / status / refund / cancel + `verifySignature`. |
| `src/modules/midtrans/service.ts` | `MidtransPaymentProviderService extends AbstractPaymentProvider`. `initiatePayment` (Snap, `order_id = session_id`), `authorize`/`getPaymentStatus` (live status — authorization only succeeds once Midtrans really reports the money as paid, so a forged webhook can't create an order), `capture`, `refund`, `cancel`, and `getWebhookActionAndData` (→ `SUCCESSFUL` on settlement). |
| `src/modules/midtrans/index.ts` | `ModuleProvider(Modules.PAYMENT, …)`. |
| `medusa-config.ts` | Registers the provider (`id: "midtrans"` → `pp_midtrans_midtrans`). |
| `src/scripts/setup-id-storefront.ts` | Enables the provider on the Indonesia region. |
| `src/api/store/checkout/status/route.ts` | Read-only "is the order created yet?" for the Verify button. |

**Storefront (`muru-web`)**
| File | Role |
| --- | --- |
| `lib/data/checkout.ts` | `startPayment` (initiate session → `redirect_url`), `checkPaymentStatus` (poll backend status). |
| `app/[lang]/checkout/processing/page.tsx` | Processing / failed UI. |
| `components/verify-payment.tsx` | "I've paid — verify payment" button + auto-poll → redirect to `/order/[id]`. |

## Environment

**Backend** (`muru-cms/.env`, see `.env.template`):

| Var | Notes |
| --- | --- |
| `MIDTRANS_SERVER_KEY` | Server key (sandbox or prod). Backend-only. |
| `MIDTRANS_IS_PRODUCTION` | `false` = sandbox, `true` = production. |
| `STOREFRONT_URL` | Storefront origin for the Snap finish-redirect. |
| `MIDTRANS_NOTIFICATION_URL` | Optional; appended per-transaction (ngrok in dev). |

The storefront needs **no** Midtrans keys.

## Configure the webhook

Set the Midtrans dashboard **Settings → Configuration → Payment Notification URL** to the
backend's built-in payment webhook:

```
https://<backend-host>/hooks/payment/midtrans_midtrans
```

Note the path segment is `midtrans_midtrans` — **without** the `pp_` prefix. Medusa's built-in
webhook subscriber prepends `pp_` to the `:provider` URL param when resolving the provider, so
`/hooks/payment/pp_midtrans_midtrans` fails with "Could not resolve 'pp_pp_midtrans_midtrans'".

Midtrans can't reach `localhost`. For local dev run `ngrok http 9000` (the Medusa port) and use
that URL — either in the dashboard or via `MIDTRANS_NOTIFICATION_URL`.

## Apply & test

1. In `muru-cms`: set the env vars, rebuild/restart (`npm run build` / `medusa develop`), and run
   the region setup: `npx medusa exec ./src/scripts/setup-id-storefront.ts`. This enables
   **only** `pp_midtrans_midtrans` on the region and detaches `pp_system_default`.
2. Confirm: `GET /store/payment-providers?region_id=…` lists **only** `pp_midtrans_midtrans`.
3. `ngrok http 9000` → set the notification URL.
4. In `muru-web`: cart → checkout → fill form → calculate shipping → courier → **Confirm & pay**
   → Midtrans page. Card `4811 1111 1111 1114`, any future expiry/CVV, OTP `112233`.
5. Return to `/checkout/processing` → **Verify payment** (or wait for the poll) → `/order/[id]`.
   In Medusa **admin** the order shows a **Midtrans** payment (captured).
6. **QRIS/VA:** pick VA, don't pay → processing stays pending; settle it (real payment or the
   Midtrans dashboard) → webhook completes → Verify/poll lands on the order.
7. **Closed-tab:** pay then close before redirect → webhook still creates the order.
8. **Refund:** refund the order in Medusa admin → `provider.refundPayment` hits Midtrans.

## Tests

Provider logic (signature verification + webhook action mapping) is covered by a unit test in
`muru-cms`: `src/modules/midtrans/__tests__/service.unit.spec.ts`. Run it with:

```
cd muru-cms && npm run test:unit
```

It asserts: valid/invalid/tampered signatures, and that `settlement` / `capture+accept` →
`SUCCESSFUL`, `pending` → `PENDING`, `expire`/`deny`/`cancel` → `CANCELED`, bad signature →
`NOT_SUPPORTED`.

## Notes

- **Only `pp_midtrans_midtrans` is enabled** on the region. The built-in `pp_system_default` is
  still registered by the payment module but is linked to no region, so it's never offered.
- `initiatePayment` sets the Midtrans `order_id` to the Medusa **payment session id**, so the
  webhook maps straight back (`getWebhookActionAndData` returns `session_id = order_id`).
- Amount integrity is Medusa's: `gross_amount` comes from the payment session amount (the order
  total), so tax/discounts are handled correctly.
- The built-in `/hooks/payment/:provider` route + `processPaymentWorkflow` do authorize +
  capture + cart-completion automatically when the provider returns `SUCCESSFUL`; no custom
  webhook route is needed.
