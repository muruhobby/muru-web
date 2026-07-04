# Order → payment, in detail

The complete lifecycle from "customer clicks Confirm & pay" to "captured payment on a
Medusa order", across both repos (`muru-web` storefront, `muru-cms` backend). This flow
was verified end-to-end against the Midtrans sandbox (BCA VA settlement) on 2026-07-04.

Cast:

- **Storefront** — Next.js server actions in `muru-web/lib/data/checkout.ts`.
- **Backend** — Medusa v2 + the Midtrans payment provider (`muru-cms/src/modules/midtrans`).
- **Midtrans** — Snap (hosted payment page) + Core API (status/refund) + webhook notifications.

```
Storefront                Backend (Medusa)                    Midtrans
──────────                ────────────────                    ────────
startPayment(optionId)
  ├─ addShippingMethod ──► cart total now final
  ├─ initiatePaymentSession
  │                       ├─ payment collection + session
  │                       └─ provider.initiatePayment ──────► POST /snap/v1/transactions
  │                                                            (order_id = session id)
  │                       ◄── { token, redirect_url } ────────┘
  ◄─ redirect_url
window.location = redirect_url ─────────────────────────────► customer pays on hosted page
                                                               ├─ webhook (settlement) ──► POST /hooks/payment/midtrans_midtrans
                                                               └─ finish redirect ───────► /checkout/processing
                          webhook subscriber:
                          ├─ getWebhookActionAndData: verify signature → SUCCESSFUL
                          └─ processPaymentWorkflow:
                             ├─ authorize (live status check ► GET /v2/{order_id}/status)
                             ├─ capture (no-op, Snap auto-captures)
                             └─ complete cart ⇒ ORDER + order_cart link
/checkout/processing
  └─ poll checkPaymentStatus ─► GET /store/checkout/status?cart_id
                          ◄─ { order_id } once the order exists
clear cart cookie → /order/[id]
```

## Phase 0 — prerequisites (already true before checkout)

1. Cart exists (id in the `_medusa_cart_id` httpOnly cookie), region = Indonesia (IDR).
2. Checkout page saved the address (shipping + billing, `country_code: "id"`) and email
   onto the cart, then listed shipping options; Biteship options are
   `price_type: "calculated"` and were priced per-option via the calculate endpoint
   (live JNE/J&T rates by destination postal code + item weights).

## Phase 1 — start payment (storefront `startPayment`)

1. `POST /store/carts/{id}/shipping-methods` with the chosen option → shipping cost is
   added; **the cart total is now final** and becomes the payment amount.
2. `sdk.store.payment.initiatePaymentSession(cart, { provider_id: "pp_midtrans_midtrans" })`.
   Medusa creates (or reuses) the cart's payment collection, creates a payment session
   for the provider, and calls the provider's `initiatePayment` with the session amount.
3. Provider (`service.ts#initiatePayment`):
   - Uses the Medusa **payment session id as the Midtrans `order_id`** — this is the
     join key for everything that follows.
   - `POST {app}/snap/v1/transactions` (Basic auth: server key) with
     `transaction_details { order_id, gross_amount }`, optional customer details, and
     `callbacks.finish = ${STOREFRONT_URL}/checkout/processing`. If
     `MIDTRANS_NOTIFICATION_URL` is set (ngrok in dev), it's appended per-transaction
     via the `X-Append-Notification` header.
   - Stores in the session `data`: `midtrans_order_id`, `session_id`, `redirect_url`,
     `token`.
4. Storefront pulls `redirect_url` out of the returned session data and the client does
   `window.location.href = redirectUrl`. Session status is `pending`.

## Phase 2 — customer pays on Midtrans

The hosted Snap page offers card / QRIS / virtual account / e-wallets:

- **Card**: pays instantly (`capture`). Sandbox card `4811 1111 1111 1114`, OTP `112233`.
- **QRIS / VA**: transaction goes `pending` until the customer actually transfers —
  possibly minutes or hours later, possibly after closing the browser tab.

Two independent signals leave Midtrans:

- **Finish redirect** (customer's browser) → `/checkout/processing?order_id=…&transaction_status=…`.
  Purely informational; `deny`/`cancel`/`expire`/`failure` render the failed state,
  anything else renders "waiting for payment".
- **Webhook notification** (server-to-server, the source of truth) → next phase.

## Phase 3 — webhook creates the order (backend)

1. Midtrans `POST`s the notification JSON to **`/hooks/payment/midtrans_midtrans`**.
   ⚠️ The path uses the provider id *without* `pp_` — Medusa's built-in webhook
   subscriber prepends `pp_` when resolving the provider. Posting to
   `/hooks/payment/pp_midtrans_midtrans` fails with
   "Could not resolve 'pp_pp_midtrans_midtrans'". The route itself always answers
   `200 OK` immediately; processing is async via the event bus.
2. The payment module calls the provider's `getWebhookActionAndData`:
   - Recomputes `sha512(order_id + status_code + gross_amount + serverKey)` and
     timing-safe-compares it to `signature_key`. Mismatch → `NOT_SUPPORTED` (dropped).
   - Maps `transaction_status`: `settlement` or `capture` (fraud ≠ deny) →
     **SUCCESSFUL**; `pending` → PENDING; `deny`/`cancel`/`expire`/`failure` → CANCELED.
   - Returns `{ session_id: order_id, amount }` — Medusa finds the payment session by
     that id (this works because Phase 1 set `order_id` = session id).
3. On SUCCESSFUL, Medusa's `processPaymentWorkflow` runs:
   - **Authorize**: calls the provider's `authorizePayment`, which ignores the webhook
     payload and asks Midtrans for the **live** status (`GET /v2/{order_id}/status`).
     Only `settlement`/`capture` map to `captured` and pass. Consequence: a
     correctly-signed but premature/replayed webhook cannot create an order — verified
     live (authorization failed while the sandbox transaction was still pending, then
     succeeded after real settlement).
   - **Capture**: provider no-op (Snap already captured the money); Medusa records the
     capture (`captured_at` on the payment).
   - **Complete cart**: the cart becomes an order; an `order_cart` link row now maps
     `cart_id → order_id`.

A CANCELED action (expiry/denial) cancels the payment session instead; no order.

## Phase 4 — the storefront finds out

1. `/checkout/processing` mounts `VerifyPayment`: auto-polls every 4s (max ~2 min) plus
   a manual "I've paid — verify payment" button.
2. Each poll: server action `checkPaymentStatus()` → backend
   `GET /store/checkout/status?cart_id=…` → queries the `order_cart` link (read-only) →
   `{status:"pending"}` or `{status:"completed", order_id}`.
3. On `order_id`: the action deletes the `_medusa_cart_id` cookie and the client
   `router.replace`s to `/order/{order_id}` — the confirmation page (items, address,
   totals via `getOrder`).

If the customer closed the tab after paying: the webhook still created the order; the
next visit to the account/orders shows it. If they never pay: the Snap transaction
expires (~24h), the webhook says `expire` → CANCELED, and the cart survives so checkout
can be restarted (a new session/Snap transaction is created on the next attempt).

## Phase 5 — after the order (admin)

- Order shows a **Midtrans** payment, captured, amount = cart total (IDR integer).
- **Refund** from the admin → provider `refundPayment` → Midtrans
  `POST /v2/{order_id}/refund` with a unique `refund_key`.
- **Fulfillment** → Biteship provider books the real shipment (courier identity was
  persisted on the shipping method at checkout) and attaches the waybill/tracking URL.

## Amount & currency notes

- `gross_amount` always comes from the Medusa payment session amount — the storefront
  never sends a price to Midtrans, so discounts/taxes can't be bypassed.
- IDR has no decimals in Medusa; Midtrans reports `"159000.00"` strings — the provider
  normalizes via BigNumber + `Math.round`.
- The webhook signature covers `order_id + status_code + gross_amount` only; that's why
  authorization re-checks the live status rather than trusting `transaction_status`.

## Testing the loop locally

Backend `.env`: sandbox `MIDTRANS_SERVER_KEY`, `MIDTRANS_IS_PRODUCTION=false`,
`STOREFRONT_URL=http://localhost:3000`, and either set the dashboard notification URL or
`MIDTRANS_NOTIFICATION_URL=https://<ngrok>/hooks/payment/midtrans_midtrans`
(`ngrok http 9000`). Sandbox settlement without a browser: charge the Snap token as a VA
(`POST {app}/snap/v2/transactions/{token}/charge` with `{"payment_type":"bca_va"}`), then
pay the VA number at simulator.sandbox.midtrans.com → status flips to `settlement` and
the webhook (or a re-sent signed notification) completes the order. Full manual steps:
`muru-web/docs/payments-midtrans.md`.
