# muru-web — cart, checkout & order logic

End-to-end flow from "add to cart" to the order confirmation page. The storefront never
creates the order itself — **the Medusa order is created by the backend when the
Midtrans payment webhook confirms settlement**. A step-by-step walkthrough of the whole
payment lifecycle across both repos is in [order-to-payment.md](order-to-payment.md);
manual test steps are in `docs/payments-midtrans.md`.

## 1. Cart (`lib/data/cart.ts`)

- `getOrCreateCart()` lazily creates a cart in the ID region and stores its id in the
  httpOnly `_medusa_cart_id` cookie (1 week).
- `addToCart` / `updateLineItem` / `removeLineItem` mutate lines; quantity ≤ 0 deletes.
  Each mutation revalidates `/[lang]/cart` and the layout (header cart badge).
- Carts are guest-capable; if the customer is logged in, `getAuthHeaders()` links the
  cart to them.

## 2. Address → live courier rates (`applyAddressAndGetRates` in `lib/data/checkout.ts`)

Driven by `components/checkout-client.tsx` on `/checkout`:

1. Saves the address (always `country_code: "id"`) as both shipping and billing, plus the
   email, onto the cart.
2. Lists the cart's shipping options. Options from the backend's **Biteship** fulfillment
   provider are `price_type: "calculated"` — each one is priced via the calculate
   endpoint, which asks Biteship for a live JNE / J&T rate for the destination + item
   weights.
3. Pricing degrades gracefully: a courier whose rate call fails is dropped (errors are
   logged server-side), and only if *no* option survives does the customer see an error
   (usual causes: bad postal code, Biteship balance).

## 3. Confirm & pay (`startPayment`)

1. Locks in the chosen shipping option (`addShippingMethod`) — the total is now final.
2. Initiates a payment session for provider `pp_midtrans_midtrans`. The backend provider
   creates a Midtrans **Snap** transaction (its `order_id` = the Medusa payment session
   id) and returns `redirect_url` in the session data.
3. The client does `window.location.href = redirectUrl` — the customer pays on Midtrans'
   hosted page (card, QRIS, virtual account, etc.).

## 4. Processing page (`/checkout/processing`)

Midtrans' finish-redirect lands here (`transaction_status` query param; `deny`/`cancel`/
`expire`/`failure` render the failed state with a back-to-checkout link).

`components/verify-payment.tsx` handles the pending state:
- Auto-polls `checkPaymentStatus()` every 4s for ~2 minutes, plus a manual
  "I've paid — verify payment" button.
- `checkPaymentStatus()` calls the backend's read-only `/store/checkout/status?cart_id=…`
  which reports whether an order exists for the cart yet. **The webhook is the source of
  truth** — this endpoint only observes. This matters for QRIS/VA payments that settle
  minutes or hours later, and for customers who close the tab (the order still gets
  created; it shows up in their account).
- On success it clears the cart cookie and redirects to `/order/[id]`.

## 5. Order confirmation (`/order/[id]`)

`getOrder()` retrieves the order (items, shipping address/method, totals, display id) and
the page renders the receipt. Unknown ids → `notFound()`. The page is `robots: noindex`.

## Failure modes to keep in mind

- A forged or premature webhook cannot create an order: the backend provider re-checks
  the live Midtrans transaction status before authorizing.
- If the customer abandons the Midtrans page, the cart (and cookie) survive — they can
  restart checkout; re-initiating creates a fresh payment session.
- `checkPaymentStatus` swallows all errors as "still pending" so transient backend
  hiccups never strand the customer on an error screen.
