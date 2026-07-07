// Wishlist for signed-in customers, stored as a list of product ids in the
// customer's `metadata.wishlist` (the backend has no wishlist module; the
// store API lets a customer update their own metadata, which is enough here).

import { sdk } from "../medusa";
import type { StoreCustomer, StoreProduct } from "../types";

const WISHLIST_KEY = "wishlist";
const MAX_ITEMS = 100;

// Same shape the catalog pages use, so wishlist cards render like ProductCard.
const WISHLIST_PRODUCT_FIELDS =
  "*variants.calculated_price,*categories,+metadata,*images";

export function getWishlistIds(customer: StoreCustomer | null): string[] {
  const raw = customer?.metadata?.[WISHLIST_KEY];
  return Array.isArray(raw) ? raw.filter((id) => typeof id === "string") : [];
}

export function isInWishlist(
  customer: StoreCustomer | null,
  productId: string
): boolean {
  return getWishlistIds(customer).includes(productId);
}

/**
 * Add or remove a product id and persist the new list. Returns the updated
 * list; callers should `refreshCustomer()` afterwards so `useStore()` agrees.
 */
export async function toggleWishlist(
  customer: StoreCustomer,
  productId: string
): Promise<string[]> {
  const current = getWishlistIds(customer);
  const next = current.includes(productId)
    ? current.filter((id) => id !== productId)
    : [...current, productId].slice(-MAX_ITEMS);
  await sdk.store.customer.update({ metadata: { [WISHLIST_KEY]: next } });
  return next;
}

/** Resolve wishlist ids to priced products, keeping the saved order. */
export async function fetchWishlistProducts(
  ids: string[]
): Promise<StoreProduct[]> {
  if (ids.length === 0) return [];
  const { regions } = await sdk.store.region.list();
  const regionId = regions?.[0]?.id;
  const { products } = await sdk.store.product.list({
    id: ids,
    region_id: regionId,
    fields: WISHLIST_PRODUCT_FIELDS,
    limit: ids.length,
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  // A product deleted from the catalog just drops out of the list.
  return ids.map((id) => byId.get(id)).filter((p): p is StoreProduct => !!p);
}
