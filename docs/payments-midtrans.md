# Midtrans Payment (Snap redirect, Medusa provider)

How checkout payment works, configured as a **Medusa payment provider** in the backend
(`muru-cms`) with the storefront (`muru-web`) using the standard payment-session flow.

## Overview

Payment uses **Midtrans Snap** in **redirect** mode, with **order-first checkout**: after the
customer calculates shipping and picks a courier, confirming **creates the Medusa order
immediately** (payment authorized but unpaid) and then sends them to Midtrans' hosted payment
page. When Midtrans confirms payment via the **webhook**, the payment is **captured** and the
order flips to paid — awaiting fulfillment. This works even if the customer closes the tab or
pays later by **QRIS / virtual account**; the order is already there, only its payment status
changes.

Because this is a real Medusa payment provider (`pp_midtrans_midtrans`), Medusa records the
actual captured payment and supports **refunds from the admin** — unlike a storefront-only
integration.

## Flow

```
muru-web: Confirm & pay
  → initiatePaymentSession(cart, "pp_midtrans_midtrans")
      → [muru-cms] provider.initiatePayment(): Snap create (SERVER KEY)
        → returns redirect_url in the payment session `data`
  → cart.complete() → ORDER created now (provider authorizes pending txns)
        clear cart cookie, remember order id in _medusa_order_id cookie
  → storefront redirects customer to Midtrans hosted page
  → customer pays (card instantly / QRIS-VA later)
       ├─ Midtrans webhook → POST /hooks/payment/midtrans_midtrans   [muru-cms, built-in]
       │     provider.getWebhookActionAndData() verifies signature → SUCCESSFUL
       │     → processPaymentWorkflow → capturePayment → order is PAID
       └─ Midtrans redirect → muru-web /checkout/processing  ("processing" + Verify button)
             Verify/poll → checkPaymentStatus() → GET /store/checkout/status?order_id [muru-cms]
                            → { order_id, paid: true } once the webhook captured it
             paid → clear order cookie → /order/[id]
Admin refund → provider.refundPayment() → Midtrans refund API
```

The **webhook is the source of truth for payment**; the processing page's **Verify payment**
button + light auto-poll just check whether the payment has been captured yet (read-only),
which matters for QRIS/VA that settle minutes/hours later. In the Medusa admin the order
shows payment **Authorized** (awaiting payment) until settlement, then **Captured** (paid);
fulfillment status stays "not fulfilled" until staff ship it — that's the "paid, waiting for
shipment" state.

If the customer never pays, the Snap transaction expires (~24h) and the webhook reports
`expire` → the payment session is canceled; the order remains with an unpaid/canceled payment
and can be canceled from the admin.

## Key files

**Backend (`muru-cms`)**
| File | Role |
| --- | --- |
| `src/modules/midtrans/client.ts` | Snap create / status / refund / cancel + `verifySignature`. |
| `src/modules/midtrans/service.ts` | `MidtransPaymentProviderService extends AbstractPaymentProvider`. `initiatePayment` (Snap, `order_id = session_id`), `authorizePayment` (order-first: a still-pending transaction authorizes so cart completion succeeds pre-payment; denied/expired don't), `getPaymentStatus` (live status), `capture`, `refund`, `cancel`, and `getWebhookActionAndData` (→ `SUCCESSFUL` on settlement → capture; signature-verified, so a forged webhook can't mark an order paid). |
| `src/modules/midtrans/index.ts` | `ModuleProvider(Modules.PAYMENT, …)`. |
| `medusa-config.ts` | Registers the provider (`id: "midtrans"` → `pp_midtrans_midtrans`). |
| `src/scripts/setup-id-storefront.ts` | Enables the provider on the Indonesia region. |
| `src/api/store/checkout/status/route.ts` | Read-only "is the order paid yet?" (`order_id` or `cart_id`) for the Verify button. |

**Storefront (`muru-web`)**
| File | Role |
| --- | --- |
| `lib/data/checkout.ts` | `startPayment` (initiate session → complete cart → **order created** → `redirect_url`), `checkPaymentStatus` (poll paid status by order id). |
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
4. In `muru-web`: cart → checkout → fill form → calculate shipping → courier → **Confirm & pay**.
   The **order is created now** (admin shows it with payment *Authorized*), then the browser
   goes to the Midtrans page. Card `4811 1111 1111 1114`, any future expiry/CVV, OTP `112233`.
5. Return to `/checkout/processing` → **Verify payment** (or wait for the poll) → `/order/[id]`.
   In Medusa **admin** the order's payment is now **Captured** (paid), fulfillment pending.
6. **QRIS/VA:** pick VA, don't pay → processing stays pending and the order stays *Authorized*;
   settle it (real payment or the simulator) → webhook captures → Verify/poll lands on the order.
7. **Closed-tab:** pay then close before redirect → webhook still marks the order paid.
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
