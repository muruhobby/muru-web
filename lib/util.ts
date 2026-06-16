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

export function getVariantPrice(product: StoreProduct): number | null {
  const amount = product.variants?.[0]?.calculated_price?.calculated_amount;
  return typeof amount === "number" ? amount : null;
}
