import Link from "next/link";
import { formatIDR, getProductMeta, getVariantPrice } from "@/lib/util";
import type { StoreProduct } from "@/lib/types";
import { AddToCartButton } from "./add-to-cart-button";

const BADGE_STYLES: Record<string, string> = {
  HOT: "bg-orange text-white",
  NEW: "bg-white text-ink border border-line",
  LIMITED: "bg-ink text-white",
};

export function ProductCard({
  product,
  wide = false,
}: {
  product: StoreProduct;
  wide?: boolean;
}) {
  const { badge, categoryLabel, emoji } = getProductMeta(product);
  const price = getVariantPrice(product);
  const variantId = product?.variants?.[0]?.id ?? null;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-line bg-white transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      <Link
        href={`/product/${product.handle}`}
        className={`relative grid place-items-center bg-paper ${
          wide ? "h-44" : "h-40"
        }`}
      >
        {badge && (
          <span
            className={`eyebrow absolute left-3 top-3 rounded px-2 py-1 ${
              BADGE_STYLES[badge] ?? BADGE_STYLES.NEW
            }`}
          >
            {badge}
          </span>
        )}
        <span className="text-5xl transition-transform duration-300 group-hover:scale-110">
          {emoji}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {categoryLabel && (
          <p className="eyebrow mb-1 text-muted">{categoryLabel}</p>
        )}
        <Link href={`/product/${product.handle}`}>
          <h3 className="font-bold leading-snug text-ink hover:text-orange">
            {product.title}
          </h3>
        </Link>
        {product.subtitle && (
          <p className="mt-1 text-sm text-muted">{product.subtitle}</p>
        )}

        <div className="mt-3 flex items-center justify-between gap-2 pt-1">
          <span className="text-lg font-extrabold text-ink">
            {price !== null ? formatIDR(price) : "—"}
          </span>
          <AddToCartButton variantId={variantId} label="Add" />
        </div>
      </div>
    </div>
  );
}
