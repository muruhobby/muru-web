// Cart operations that run in the browser against the Medusa store API.
// The SDK attaches the publishable key and the customer JWT automatically.

import { sdk } from "../medusa";
import { getCartId, setCartId } from "./session";
import type { StoreCart, StoreCustomer } from "../types";

const CART_FIELDS =
  "*items,*items.variant,*items.product,+items.thumbnail,*region,*shipping_methods";

let regionIdPromise: Promise<string> | null = null;

function getRegionId(): Promise<string> {
  regionIdPromise ??= sdk.store.region
    .list()
    .then(({ regions }) => {
      if (!regions?.length) {
        throw new Error(
          "No region configured in Medusa. Run the backend setup script first."
        );
      }
      return regions[0].id;
    })
    .catch((e) => {
      regionIdPromise = null; // transient failure — retry next time
      throw e;
    });
  return regionIdPromise;
}

export async function retrieveCart(): Promise<StoreCart | null> {
  const id = getCartId();
  if (!id) return null;
  try {
    const { cart } = await sdk.store.cart.retrieve(id, { fields: CART_FIELDS });
    return cart;
  } catch {
    return null;
  }
}

async function getOrCreateCartId(): Promise<string> {
  const existing = await retrieveCart();
  if (existing) return existing.id;

  const region_id = await getRegionId();
  const { cart } = await sdk.store.cart.create({ region_id });
  setCartId(cart.id);
  void rememberCartForCustomer(cart.id);
  return cart.id;
}

// The active cart id is kept on the customer record so a signed-in session on
// another device (or after localStorage is cleared) can pick the cart back up.
const CART_META_KEY = "cart_id";

async function rememberCartForCustomer(cartId: string): Promise<void> {
  const token = await sdk.client.getToken();
  if (!token) return;
  try {
    await sdk.store.customer.update({ metadata: { [CART_META_KEY]: cartId } });
  } catch {
    // Best-effort — the cart still works from localStorage.
  }
}

async function fetchOpenCart(id: string): Promise<StoreCart | null> {
  try {
    const { cart } = await sdk.store.cart.retrieve(id, { fields: CART_FIELDS });
    return cart.completed_at ? null : cart;
  } catch {
    return null;
  }
}

/**
 * Called right after login/signup. Keeps the guest cart, joins in any open
 * cart remembered on the customer record, hands ownership of the result to
 * the customer, and remembers it. Callers should `refreshCart()` afterwards.
 */
export async function reconcileCartAfterAuth(): Promise<void> {
  const token = await sdk.client.getToken();
  if (!token) return;

  let customer: StoreCustomer;
  try {
    ({ customer } = await sdk.store.customer.retrieve());
  } catch {
    return;
  }

  const localId = getCartId();
  const savedMeta = customer.metadata?.[CART_META_KEY];
  const savedId = typeof savedMeta === "string" ? savedMeta : null;

  const local = localId ? await fetchOpenCart(localId) : null;
  const saved = savedId && savedId !== localId ? await fetchOpenCart(savedId) : null;

  if (!local && !saved) return;

  if (!local && saved) {
    // Nothing local — resume the cart from the previous session as-is.
    setCartId(saved.id);
    return;
  }

  const cart = local as StoreCart;
  // Join the remembered cart's items into the one in front of the customer
  // (Medusa merges quantities for a variant that's already in the cart).
  for (const item of saved?.items ?? []) {
    if (!item.variant_id) continue;
    try {
      await sdk.store.cart.createLineItem(cart.id, {
        variant_id: item.variant_id,
        quantity: item.quantity,
      });
    } catch {
      // Variant gone or out of stock — drop it rather than block sign-in.
    }
  }

  try {
    // No-op if the cart was already created while signed in.
    await sdk.store.cart.transferCart(cart.id);
  } catch {
    // Cart may already belong to this customer.
  }
  if (savedId !== cart.id) await rememberCartForCustomer(cart.id);
}

export async function addToCart(
  variantId: string,
  quantity = 1
): Promise<StoreCart | null> {
  if (!variantId) throw new Error("Missing variant id");
  const cartId = await getOrCreateCartId();
  await sdk.store.cart.createLineItem(cartId, {
    variant_id: variantId,
    quantity,
  });
  return retrieveCart();
}

export async function updateLineItem(
  lineId: string,
  quantity: number
): Promise<StoreCart | null> {
  const id = getCartId();
  if (!id) return null;
  if (quantity <= 0) {
    await sdk.store.cart.deleteLineItem(id, lineId);
  } else {
    await sdk.store.cart.updateLineItem(id, lineId, { quantity });
  }
  return retrieveCart();
}

export async function removeLineItem(
  lineId: string
): Promise<StoreCart | null> {
  const id = getCartId();
  if (!id) return null;
  await sdk.store.cart.deleteLineItem(id, lineId);
  return retrieveCart();
}
