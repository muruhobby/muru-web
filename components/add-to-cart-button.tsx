"use client";

import { useState, useTransition } from "react";
import { addToCart } from "@/lib/data/cart";

export function AddToCartButton({
  variantId,
  className = "",
  label = "Add to cart",
}: {
  variantId: string | null;
  className?: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  if (!variantId) {
    return (
      <button
        disabled
        className={`cursor-not-allowed rounded-md border border-line px-3 py-2 text-sm font-semibold text-muted ${className}`}
      >
        Unavailable
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await addToCart(variantId, 1);
          setAdded(true);
          setTimeout(() => setAdded(false), 1500);
        })
      }
      className={`rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange disabled:opacity-60 ${className}`}
    >
      {pending ? "Adding…" : added ? "Added ✓" : label}
    </button>
  );
}
