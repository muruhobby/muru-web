# Order → payment, in detail

The complete lifecycle from "customer clicks Confirm & pay" to "captured payment on a
Medusa order", across both repos (`muru-web` storefront, `muru-cms` backend). This is an
**order-first** flow: the Medusa order is created *before* the customer is redirected to
Midtrans; paying later merely flips the order's payment from authorized to captured.
Verified end-to-end against the Midtrans sandbox (BCA VA settlement) on 2026-07-04.

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
  ├─ cart.complete ──────► authorize session (provider: pending ⇒ "authorized")
  │                       ⇒ ORDER exists, payment Authorized (unpaid)
  ├─ clear cart cookie, set _medusa_order_id cookie
  ◄─ redirect_url
window.location = redirect_url ─────────────────────────────► customer pays on hosted page
                                                               ├─ webhook (settlement) ──► POST /hooks/payment/midtrans_midtrans
                                                               └─ finish redirect ───────► /checkout/processing
                          webhook subscriber:
                          ├─ getWebhookActionAndData: verify signature → SUCCESSFUL
                          └─ processPaymentWorkflow:
                             ├─ session already authorized (idempotent skip)
                             └─ capturePayment ⇒ order payment = Captured (PAID)
/checkout/processing
  └─ poll checkPaymentStatus ─► GET /store/checkout/status?order_id
                          ◄─ { order_id, paid: true } once captured
clear order cookie → /order/[id]
```

## Phase 0 — prerequisites (already true before checkout)

1. Cart exists (id in the `_medusa_cart_id` httpOnly cookie), region = Indonesia (IDR).
2. Checkout page saved the address (shipping + billing, `country_code: "id"`) and email
   onto the cart, then listed shipping options; Biteship options are
   `price_type: "calculated"` and were priced per-option via the calculate endpoint
   (live JNE/J&T rates by destination postal code + item weights).

## Phase 1 — start payment & create the order (storefront `startPayment`)

1. `POST /store/carts/{id}/shipping-methods` with the chosen option → shipping cost is
   added; **the cart total is now final** and becomes the payment amount.
2. `sdk.store.payment.initiatePaymentSession(cart, { provider_id: "pp_midtrans_midtrans" })`.
   Medusa creates the cart's payment collection + a payment session, and calls the
   provider's `initiatePayment` with the session amount.
3. Provider (`service.ts#initiatePayment`):
   - Uses the Medusa **payment session id as the Midtrans `order_id`** — the join key
     for everything that follows.
   - `POST {app}/snap/v1/transactions` (Basic auth: server key) with
     `transaction_details { order_id, gross_amount }`, optional customer details, and
     `callbacks.finish = ${STOREFRONT_URL}/checkout/processing`. If
     `MIDTRANS_NOTIFICATION_URL` is set (ngrok in dev), it's appended per-transaction
     via the `X-Append-Notification` header.
   - Stores in the session `data`: `midtrans_order_id`, `session_id`, `redirect_url`,
     `token`.
4. **`sdk.store.cart.complete(cartId)` — the order is created here, pre-payment.**
   Medusa's complete-cart workflow authorizes the payment session; the provider's
   `authorizePayment` checks the live Midtrans status and maps *pending / not-yet-charged*
   to **authorized** (that's the order-first enabler). The result: an order with
   payment **Authorized** (awaiting payment), fulfillment not started.
5. The storefront clears the cart cookie, stores the order id in the httpOnly
   `_medusa_order_id` cookie (1 day) so the processing page can find it, and only then
   sends the browser to `redirect_url`. If completion fails, the customer stays on
   checkout with an error — no redirect.

## Phase 2 — customer pays on Midtrans

The hosted Snap page offers card / QRIS / virtual account / e-wallets:

- **Card**: pays instantly (`capture`). Sandbox card `4811 1111 1111 1114`, OTP `112233`.
- **QRIS / VA**: transaction stays `pending` until the customer actually transfers —
  possibly minutes or hours later, possibly after closing the browser tab. The order
  already exists throughout.

Two independent signals leave Midtrans:

- **Finish redirect** (customer's browser) → `/checkout/processing?order_id=…&transaction_status=…`.
  Purely informational; `deny`/`cancel`/`expire`/`failure` render the failed state,
  anything else renders "waiting for payment".
- **Webhook notification** (server-to-server, the source of truth for payment) → next phase.

## Phase 3 — webhook captures the payment (backend)

1. Midtrans `POST`s the notification JSON to **`/hooks/payment/midtrans_midtrans`**.
   ⚠️ The path uses the provider id *without* `pp_` — Medusa's built-in webhook
   subscriber prepends `pp_` when resolving the provider. Posting to
   `/hooks/payment/pp_midtrans_midtrans` fails with
   "Could not resolve 'pp_pp_midtrans_midtrans'". The route always answers `200 OK`
   immediately; processing is async via the event bus.
2. The payment module calls the provider's `getWebhookActionAndData`:
   - Recomputes `sha512(order_id + status_code + gross_amount + serverKey)` and
     timing-safe-compares it to `signature_key`. Mismatch → `NOT_SUPPORTED` (dropped).
   - Maps `transaction_status`: `settlement` or `capture` (fraud ≠ deny) →
     **SUCCESSFUL**; `pending` → PENDING; `deny`/`cancel`/`expire`/`failure` → CANCELED.
   - Returns `{ session_id: order_id, amount }` — Medusa finds the payment session by
     that id (works because Phase 1 set `order_id` = session id).
3. On SUCCESSFUL, Medusa's `processPaymentWorkflow` runs:
   - **Authorize**: the session was already authorized at cart completion — idempotent
     skip. (For sessions not yet authorized, the provider still re-checks the **live**
     Midtrans status, so a forged webhook can't do damage; and capture only records
     what Midtrans actually settled.)
   - **Capture**: provider no-op (Snap already captured the money); Medusa records the
     capture — `captured_at` on the payment, payment collection → `completed`. **The
     order is now paid**; in the admin it reads payment *Captured*, fulfillment
     *Not fulfilled* — i.e. paid, waiting for shipment.

A CANCELED action (expiry/denial) cancels the payment session instead; the order stays
unpaid until the auto-cancel job sweeps it. Snap transactions expire after ~24h unpaid.

## Phase 4 — the storefront finds out

1. `/checkout/processing` mounts `VerifyPayment`: auto-polls every 4s (max ~2 min) plus
   a manual "I've paid — verify payment" button.
2. Each poll: server action `checkPaymentStatus()` reads the `_medusa_order_id` cookie →
   backend `GET /store/checkout/status?order_id=…` → looks up the order's payment
   collections (read-only) → `{status:"completed", order_id, paid: boolean}`. (The
   endpoint also still accepts `cart_id`, resolved through the `order_cart` link, for
   payments started before the order-first flow.)
3. On `paid: true`: the action deletes the order cookie and the client `router.replace`s
   to `/order/{order_id}` — the confirmation page (items, address, totals via `getOrder`).

If the customer closed the tab after paying: the webhook still captures; the order was
already theirs. If they never pay: the Snap transaction expires (~24h), and the hourly
`cancel-unpaid-orders` job cancels the order after `UNPAID_ORDER_CANCEL_HOURS` (default
48h); the cart cookie is already gone, so their next visit starts a fresh cart.

## Phase 5 — after the order (admin)

- Lifecycle in the admin: payment **Authorized** (awaiting payment) → webhook →
  **Captured** (paid) → staff fulfill → Biteship books the real shipment (courier
  identity was persisted on the shipping method at checkout) with waybill/tracking URL.
- **Refund** from the admin → provider `refundPayment` → Midtrans
  `POST /v2/{order_id}/refund` with a unique `refund_key`.
- Unpaid orders are swept automatically: the hourly `cancel-unpaid-orders` job
  (`src/jobs/`) cancels orders older than `UNPAID_ORDER_CANCEL_HOURS` (default 48h) with
  no captured payment, canceling the payment session and releasing stock reservations.

## Amount & currency notes

- `gross_amount` always comes from the Medusa payment session amount — the storefront
  never sends a price to Midtrans, so discounts/taxes can't be bypassed.
- IDR has no decimals in Medusa; Midtrans reports `"159000.00"` strings — the provider
  normalizes via BigNumber + `Math.round`.
- The webhook signature covers `order_id + status_code + gross_amount` only; capture is
  what Midtrans actually settled, and authorization re-checks live status when needed.

## Testing the loop locally

Backend `.env`: sandbox `MIDTRANS_SERVER_KEY`, `MIDTRANS_IS_PRODUCTION=false`,
`STOREFRONT_URL=http://localhost:3000`, and either set the dashboard notification URL or
`MIDTRANS_NOTIFICATION_URL=https://<ngrok>/hooks/payment/midtrans_midtrans`
(`ngrok http 9000`). Sandbox settlement without a browser: charge the Snap token as a VA
(`POST {app}/snap/v2/transactions/{token}/charge` with `{"payment_type":"bca_va"}`), then
pay the VA number at simulator.sandbox.midtrans.com → status flips to `settlement` and
the webhook (or a re-sent signed notification) captures the payment. Full manual steps:
`muru-web/docs/payments-midtrans.md`.
