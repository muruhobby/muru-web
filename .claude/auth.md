# muru-web — customer auth

The storefront authenticates **customers only** (shoppers). There are no staff/admin
logins here — admin users and RBAC live in the `muru-cms` backend (see its
`.claude/roles.md`).

## How it works

Auth is Medusa's `emailpass` provider for the `customer` actor, driven through the JS SDK
(`sdk.auth.*`) from server actions in `lib/data/customer.ts`:

- **Register** (`signup`): three steps — `sdk.auth.register("customer", "emailpass")`
  returns a registration token → `sdk.store.customer.create` with that token creates the
  customer record → `sdk.auth.login` gets a customer-scoped JWT which is persisted.
- **Login** (`login`): `sdk.auth.login("customer", "emailpass")` → persist JWT.
- **Logout** (`logout`): clears the cookie and redirects home.

All three are React form actions (`useActionState`-style, `AuthState` return) used by
`components/auth-form.tsx` on `/account/login` and `/account/register`.

## Token storage & use

- The JWT is stored in the **httpOnly `_medusa_jwt` cookie** (1 week, SameSite=Lax,
  Secure in production) by `lib/cookies.ts`. It is never exposed to client JS.
- Every store API call goes through a server action / server component that calls
  `getAuthHeaders()` and passes `authorization: Bearer <jwt>` when present. The SDK is
  configured with `auth: { type: "jwt" }` (`lib/medusa.ts`).
- `getCustomer()` returns `null` on any failure (missing/expired token) rather than
  throwing — callers treat that as "logged out".

## Route protection

There is no middleware-level guard. Account pages check server-side:
`/account` and `/account/addresses` call `getCustomer()` and `redirect()` to
`/account/login` when it returns null. Everything else (catalog, cart, checkout) is
public.

## Guest vs logged-in

Guest checkout is fully supported: the cart cookie works without auth, and checkout sets
the email on the cart directly. Logging in simply attaches the customer to carts/orders
via the Bearer header (cart data functions always forward `getAuthHeaders()`), and
unlocks the saved address book (`lib/data/addresses.ts`, guests get `[]`).

## Gotchas

- `lib/cookies.ts` imports `next/headers`, deliberately making it server-only.
- After login/signup/logout, `revalidatePath("/[lang]", "layout")` refreshes the header's
  account state.
- Auth errors are mapped to friendly messages; "already exists" is special-cased on
  signup.
