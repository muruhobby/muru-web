"use server";

import { revalidatePath } from "next/cache";
import { sdk } from "../medusa";
import {
  getAuthHeaders,
  getCartId,
  setCartId,
} from "../cookies";
import { getRegion } from "./regions";

const CART_FIELDS =
  "*items,*items.variant,*items.product,+items.thumbnail,*region,*shipping_methods";

export async function getCart() {
  const id = await getCartId();
  if (!id) return null;
  const headers = await getAuthHeaders();
  try {
    const { cart } = await sdk.store.cart.retrieve(
      id,
      { fields: CART_FIELDS } as any,
      headers as any
    );
    return cart;
  } catch {
    return null;
  }
}

async function getOrCreateCart() {
  const headers = await getAuthHeaders();
  const existing = await getCart();
  if (existing) return existing;

  const region = await getRegion();
  const { cart } = await sdk.store.cart.create(
    { region_id: region.id },
    {},
    headers as any
  );
  await setCartId(cart.id);
  return cart;
}

export async function addToCart(variantId: string, quantity = 1) {
  if (!variantId) throw new Error("Missing variant id");
  const cart = await getOrCreateCart();
  const headers = await getAuthHeaders();
  await sdk.store.cart.createLineItem(
    cart.id,
    { variant_id: variantId, quantity },
    {},
    headers as any
  );
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

export async function updateLineItem(lineId: string, quantity: number) {
  const id = await getCartId();
  if (!id) return;
  const headers = await getAuthHeaders();
  if (quantity <= 0) {
    await sdk.store.cart.deleteLineItem(id, lineId, headers as any);
  } else {
    await sdk.store.cart.updateLineItem(
      id,
      lineId,
      { quantity },
      {},
      headers as any
    );
  }
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

export async function removeLineItem(lineId: string) {
  const id = await getCartId();
  if (!id) return;
  const headers = await getAuthHeaders();
  await sdk.store.cart.deleteLineItem(id, lineId, headers as any);
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}
