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
client-side: `account-view.tsx` / the addresses view wait for `customerReady` and
`router.replace` to `/account/login` when there's no customer. Everything else
(catalog, cart, checkout) is public.

## Guest vs logged-in

Guest checkout is fully supported: the cart id lives in `localStorage`
(`lib/client/session.ts`) without auth, and checkout sets the email on the cart
directly. Logging in attaches the customer to carts/orders via the SDK's Bearer header
and unlocks the saved address book (`lib/client/addresses.ts`; guests get `[]`).

## Gotchas

- `lib/client/*` modules touch `localStorage` and must only run in the browser; the
  `storage()` helper in `session.ts` no-ops during SSR.
- Auth errors are mapped to friendly messages; "already exists" is special-cased on
  signup.
