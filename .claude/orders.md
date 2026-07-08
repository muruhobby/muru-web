# muru-web — cart, checkout & order logic

End-to-end flow from "add to cart" to the order confirmation page. Checkout is
**order-first**: the Medusa order is created right before the customer is redirected to
Midtrans (payment authorized but unpaid); the settlement webhook later **captures** the
payment, flipping the order to paid. A step-by-step walkthrough of the whole payment
lifecycle across both repos is in [order-to-payment.md](order-to-payment.md); manual
test steps are in `docs/payments-midtrans.md`.

## 1. Cart (`lib/client/cart.ts`, state in `components/store-provider.tsx`)

- `getOrCreateCart()` lazily creates a cart in the ID region and stores its id in the
  browser's `localStorage` (`_medusa_cart_id`, via `lib/client/session.ts`).
- `addToCart` / `updateLineItem` / `removeLineItem` mutate lines; quantity ≤ 0 deletes.
  Each returns the fresh cart, which `StoreProvider` puts in context — the header badge
  and cart view re-render from `useStore()`.
- Carts are guest-capable, but completing checkout requires an account (`/checkout`
  gates signed-out visitors). `reconcileCartAfterAuth()` runs after login/signup: it
  merges the cart remembered on the customer record (`customer.metadata.cart_id`) into
  the local cart, transfers ownership, and remembers the merged cart.

## 2. Address → live courier rates (`applyAddressAndGetRates` in `lib/client/checkout.ts`)

Driven by `components/checkout-client.tsx` on `/checkout`:

1. The customer either uses a saved address (one card — the default shipping address —
   with a "Change" picker over the rest of the address book) or fills the new-address
   form, whose "save this address to my address book" checkbox is honored best-effort at
   order submit (`saveAddressToBook`). The chosen address (always `country_code: "id"`)
   is saved as both shipping and billing, plus the email, onto the cart.
2. Lists the cart's shipping options. Options from the backend's **Biteship** fulfillment
   provider are `price_type: "calculated"` — each one is priced via the calculate
   endpoint, which asks Biteship for a live JNE / J&T rate for the destination + item
   weights.
3. Pricing degrades gracefully: a courier whose rate call fails is dropped (errors go
   to the browser console), and only if *no* option survives does the customer see an error
   (usual causes: bad postal code, Biteship balance).

## 3. Confirm & pay (`startPayment`) — the order is created here

1. Locks in the chosen shipping option (`addShippingMethod`) — the total is now final.
2. Initiates a payment session for provider `pp_midtrans_midtrans`. The backend provider
   creates a Midtrans **Snap** transaction (its `order_id` = the Medusa payment session
   id) and returns `redirect_url` in the session data.
3. **Completes the cart** (`sdk.store.cart.complete`) — the Medusa order now exists with
   its payment *Authorized* (unpaid). The provider authorizes still-pending Midtrans
   transactions precisely to make this pre-payment completion possible.
4. Clears the cart id and stores the order id as `_medusa_order_id` (both in
   `localStorage`) for the processing page, drops the in-memory cart (header badge),
   and does `window.location.href = redirectUrl` — the customer pays on Midtrans'
   hosted page (card, QRIS, virtual account, etc.).

## 4. Processing page (`/checkout/processing`)

Midtrans' finish-redirect lands here (`transaction_status` query param; `deny`/`cancel`/
`expire`/`failure` render the failed state with a back-to-checkout link).

`components/verify-payment.tsx` handles the pending state:
- Auto-polls `checkPaymentStatus()` every 4s for ~2 minutes, plus a manual
  "I've paid — verify payment" button.
- `checkPaymentStatus()` reads the pending-order id from `localStorage` and calls the backend's read-only
  `/store/checkout/status?order_id=…`, which reports whether the order's payment has been
  captured yet. **The settlement webhook is what captures it** — this endpoint only
  observes. This matters for QRIS/VA payments that settle minutes or hours later, and for
  customers who close the tab (the order is already theirs; it just flips to paid).
  A `cart_id` fallback still exists for payments started before the order-first flow.
- Once paid it clears the pending-order id and redirects to `/order/[id]`.

## 5. Order confirmation (`/order/[id]`)

`getOrder()` retrieves the order (items, shipping address/method, totals, display id) and
the page renders the receipt. Unknown ids → `notFound()`. The page is `robots: noindex`.

## Failure modes to keep in mind

- A forged webhook cannot mark an order paid out of thin air: notifications are
  signature-verified, and capture records what Midtrans actually settled.
- If the customer abandons the Midtrans page, the order stays *Authorized* (unpaid); the
  Snap transaction expires after ~24h, and the backend's hourly `cancel-unpaid-orders`
  job auto-cancels the order after 48h (`UNPAID_ORDER_CANCEL_HOURS`). The stored cart id
  is gone, so the next visit starts a fresh cart.
- If cart completion fails, `startPayment` returns the error and no redirect happens —
  the cart is untouched.
- `checkPaymentStatus` swallows all errors as "still pending" so transient backend
  hiccups never strand the customer on an error screen.
