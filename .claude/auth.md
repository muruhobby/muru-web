# muru-web — customer auth

The storefront authenticates **customers only** (shoppers). There are no staff/admin
logins here — admin users and RBAC live in the `muru-cms` backend (see its
`.claude/roles.md`).

## How it works

Auth is Medusa's `emailpass` provider for the `customer` actor, and it runs **entirely
in the browser** through the JS SDK (`lib/client/customer.ts`):

- **Register** (`signup`): three steps — `sdk.auth.register("customer", "emailpass")`
  returns a registration token → `sdk.store.customer.create` with that token creates the
  customer record → `sdk.auth.login` gets a customer-scoped JWT which the SDK persists.
- **Login** (`login`): `sdk.auth.login("customer", "emailpass")` → SDK persists the JWT.
- **Logout** (`logout`): `sdk.auth.logout()` plus `sdk.client.clearToken()` so the token
  is gone even if the server call fails.

`components/auth-form.tsx` drives these on `/account/login` and `/account/register`,
then refreshes the shared session state (`useStore().refreshCustomer()`).

## Token storage & use

- The JWT is stored by the **Medusa SDK in `localStorage`** (`lib/medusa.ts` configures
  `auth: { type: "jwt" }`; the SDK's default browser storage is localStorage) and is
  attached automatically to subsequent store API calls.
- `retrieveCustomer()` returns `null` when there's no token or the call fails — callers
  treat that as "logged out". The `StoreProvider` fetches the customer once on mount and
  exposes it via `useStore()`.
- **Tradeoff to know**: unlike the earlier httpOnly-cookie design, a localStorage JWT is
  readable by any script on the page (XSS). Accepted here so pages can be fully static
  and all session traffic originates in the browser; don't add third-party scripts
  casually.

## Route protection

There is no middleware-level guard and no server-side check. Account views render
client-side: `account-shell.tsx` (the `(dashboard)` route-group layout around all
`/account/*` pages except login/register) waits for `customerReady` and
`router.replace`s to `/account/login` when there's no customer. Everything else
(catalog, cart, checkout) is public.

## Guest vs logged-in

Guests can browse and build a cart (the cart id lives in `localStorage`,
`lib/client/session.ts`), but **checkout requires an account**: `/checkout` shows an
auth gate to signed-out visitors, whose Create account / Sign in links carry
`?next=/checkout` so the customer lands back on checkout after authenticating.

On login/signup, `reconcileCartAfterAuth()` (`lib/client/cart.ts`) keeps the guest
cart, joins in the open cart remembered on the customer record
(`customer.metadata.cart_id`, written whenever a signed-in customer gets a new cart),
hands ownership to the customer via `transferCart`, and remembers the result — so
carts survive sign-in and follow the account across devices. Logged-in customers also
get the saved address book (`lib/client/addresses.ts`; guests get `[]`).

## Gotchas

- `lib/client/*` modules touch `localStorage` and must only run in the browser; the
  `storage()` helper in `session.ts` no-ops during SSR.
- Auth errors are mapped to friendly messages; "already exists" is special-cased on
  signup.
