export function formatIDR(amount: number | null | undefined): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
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

export function getVariantPrice(product: any): number | null {
  const variant = product?.variants?.[0];
  const amount = variant?.calculated_price?.calculated_amount;
  return typeof amount === "number" ? amount : null;
}
