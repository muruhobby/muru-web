# muru-web — roles

**The storefront has no role system of its own.** The only distinction it knows is:

| Actor | What they can do |
| --- | --- |
| Guest | Browse catalog, hold a cart (cookie), check out and pay, view an order confirmation by id. |
| Authenticated customer | Everything a guest can, plus `/account` (profile), `/account/addresses` (saved address book), and their carts/orders are linked to their customer record. |

The switch between the two is purely "is there a valid `_medusa_jwt` cookie" — see
[auth.md](auth.md). There are no permission checks, feature flags, or role fields
anywhere in this repo; don't add role logic here.

## Where roles actually live

Staff/admin roles are a **backend** concern, implemented in `muru-cms` with Medusa's RBAC
feature flag:

- **Super Admin** — full access; assigned to the owner by the backend's
  `bootstrap-admin` script.
- **Employee** — day-to-day staff role (catalog, orders, customers; no settings or user
  management), seeded by the backend's `seed-employee-role` script and auto-assigned to
  dashboard invites.

Details: `muru-cms/.claude/roles.md`. Admin users log into the Medusa dashboard at the
backend's `/app` path — never through this storefront.

## Customer JWT scope

The customer JWT stored by the storefront is scoped to the `customer` actor. It cannot
call admin APIs; the store API only lets it read/write its own customer, addresses,
carts, and orders. The publishable API key sent with every request scopes calls to the
store's sales channel; it is a routing/scoping key, not a secret.
