export function formatIDR(amount: number | null | undefined): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
}

export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong."
): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}

export type Badge = "HOT" | "NEW" | "LIMITED";

export function getProductMeta(product: { metadata?: Record<string, unknown> | null }) {
  const m = product.metadata ?? {};
  return {
    badge: (m.badge as Badge | null) ?? null,
    categoryLabel: (m.category_label as string | undefined) ?? "",
    emoji: (m.emoji as string | undefined) ?? "📦",
  };
}

import type { StoreProduct } from "./types";

/** First available product image URL, or null to fall back to the emoji. */
export function getProductImage(product: StoreProduct): string | null {
  return product.thumbnail ?? product.images?.[0]?.url ?? null;
}

export function getVariantPrice(product: StoreProduct): number | null {
  const amount = product.variants?.[0]?.calculated_price?.calculated_amount;
  return typeof amount === "number" ? amount : null;
}

/**
 * Whether a variant can currently be purchased. Requires the product to be
 * fetched with the `+variants.inventory_quantity,+variants.manage_inventory,
 * +variants.allow_backorder` fields; variants without managed inventory are
 * always in stock.
 */
export function isVariantInStock(variant: {
  manage_inventory?: boolean | null;
  allow_backorder?: boolean | null;
  inventory_quantity?: number | null;
}): boolean {
  if (!variant.manage_inventory) return true;
  if (variant.allow_backorder) return true;
  return (variant.inventory_quantity ?? 0) > 0;
}
