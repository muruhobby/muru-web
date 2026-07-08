"use client";

import { useState, useTransition } from "react";
import { useStore } from "@/components/store-provider";
import { useDict } from "@/components/i18n-provider";

export function AddToCartButton({
  variantId,
  className = "",
  compact = false,
  outOfStock = false,
}: {
  variantId: string | null;
  className?: string;
  /** Use the short "Add" label (e.g. on product cards) instead of "Add to cart". */
  compact?: boolean;
  /** Render a disabled "Out of stock" button instead of the add action. */
  outOfStock?: boolean;
}) {
  const dict = useDict();
  const { addItem } = useStore();
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  const label = compact ? dict.productCard.add : dict.addToCart.add;

  if (!variantId || outOfStock) {
    return (
      <button
        disabled
        className={`cursor-not-allowed rounded-md border border-line px-3 py-2 text-sm font-semibold text-muted ${className}`}
      >
        {outOfStock ? dict.addToCart.outOfStock : dict.addToCart.unavailable}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await addItem(variantId, 1);
          setAdded(true);
          setTimeout(() => setAdded(false), 1500);
        })
      }
      className={`rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange disabled:opacity-60 ${className}`}
    >
      {pending ? dict.addToCart.adding : added ? dict.addToCart.added : label}
    </button>
  );
}
