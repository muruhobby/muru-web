"use client";

import Link from "next/link";
import { useState } from "react";
import { AddToCartButton } from "./add-to-cart-button";
import { formatIDR } from "@/lib/util";

type Variant = {
  id: string;
  title?: string | null;
  sku?: string | null;
  calculated_price?: { calculated_amount?: number } | null;
};

export function ProductPurchase({ variants }: { variants: Variant[] }) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id ?? null);
  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];
  const price = selected?.calculated_price?.calculated_amount ?? null;
  const multi = variants.length > 1;

  return (
    <div>
      <p className="mt-6 text-3xl font-extrabold">
        {price != null ? formatIDR(price) : "—"}
      </p>

      {multi && (
        <div className="mt-6">
          <p className="eyebrow text-muted">
            Variant — <span className="text-ink">{selected?.title ?? "—"}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedId(v.id)}
                className={`rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
                  selectedId === v.id
                    ? "border-orange bg-orange/5 text-orange"
                    : "border-line text-ink-soft hover:border-ink"
                }`}
              >
                {v.title ?? "Variant"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <AddToCartButton
          variantId={selected?.id ?? null}
          label="Add to cart"
          className="px-8 py-3.5"
        />
        <Link
          href="/cart"
          className="rounded-md border border-line px-8 py-3.5 text-sm font-semibold hover:border-ink"
        >
          View cart
        </Link>
      </div>

      {selected?.sku && (
        <p className="mt-3 text-xs text-muted">SKU: {selected.sku}</p>
      )}
    </div>
  );
}
