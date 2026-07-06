// Cart operations that run in the browser against the Medusa store API.
// The SDK attaches the publishable key and the customer JWT automatically.

import { sdk } from "../medusa";
import { getCartId, setCartId } from "./session";
import type { StoreCart } from "../types";

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
  return cart.id;
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
