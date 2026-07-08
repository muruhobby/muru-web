"use client";

import { useState } from "react";
import { AddToCartButton } from "./add-to-cart-button";
import { LocalizedLink } from "./localized-link";
import { WishlistButton } from "./wishlist-button";
import { formatIDR, isVariantInStock } from "@/lib/util";
import { interpolate } from "@/lib/i18n/config";
import { useDict } from "@/components/i18n-provider";
import type { StoreProductVariant } from "@/lib/types";

export function ProductPurchase({
  productId,
  variants,
}: {
  productId: string;
  variants: StoreProductVariant[];
}) {
  const dict = useDict();
  const [selectedId, setSelectedId] = useState(
    (variants.find(isVariantInStock) ?? variants[0])?.id ?? null
  );
  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];
  const price = selected?.calculated_price?.calculated_amount ?? null;
  const multi = variants.length > 1;
  const selectedInStock = selected ? isVariantInStock(selected) : false;

  return (
    <div>
      <p className="mt-6 text-3xl font-extrabold">
        {price != null ? formatIDR(price) : "—"}
      </p>

      {multi && (
        <div className="mt-6">
          <p className="eyebrow text-muted">
            {dict.productPurchase.variant} —{" "}
            <span className="text-ink">{selected?.title ?? "—"}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {variants.map((v) => {
              const inStock = isVariantInStock(v);
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedId(v.id)}
                  className={`rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
                    selectedId === v.id
                      ? "border-orange bg-orange/5 text-orange"
                      : inStock
                        ? "border-line text-ink-soft hover:border-ink"
                        : "border-dashed border-line text-muted"
                  }`}
                >
                  {v.title ?? dict.productPurchase.variant}
                  {!inStock && (
                    <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide">
                      · {dict.productPurchase.soldOut}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <AddToCartButton
          variantId={selected?.id ?? null}
          outOfStock={!selectedInStock}
          className="px-8 py-3.5"
        />
        <LocalizedLink
          href="/cart"
          className="rounded-md border border-line px-8 py-3.5 text-sm font-semibold hover:border-ink"
        >
          {dict.productPurchase.viewCart}
        </LocalizedLink>
        <WishlistButton productId={productId} />
      </div>

      {selected?.sku && (
        <p className="mt-3 text-xs text-muted">
          {interpolate(dict.productPurchase.sku, { sku: selected.sku })}
        </p>
      )}
    </div>
  );
}
