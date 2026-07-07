"use client";

import { useEffect, useState } from "react";
import { fetchWishlistProducts, getWishlistIds, toggleWishlist } from "@/lib/client/wishlist";
import { ProductCard } from "@/components/product-card";
import { LocalizedLink } from "@/components/localized-link";
import { useStore } from "@/components/store-provider";
import { useDict } from "@/components/i18n-provider";
import type { StoreProduct } from "@/lib/types";

export function WishlistView() {
  const dict = useDict();
  const { customer, refreshCustomer } = useStore();
  const [products, setProducts] = useState<StoreProduct[] | null>(null);
  const ids = getWishlistIds(customer);
  const idsKey = ids.join(",");

  // Keep the current grid on screen while a changed list refetches; the
  // skeleton only shows before the first load.
  useEffect(() => {
    if (!customer) return;
    let cancelled = false;
    void fetchWishlistProducts(idsKey ? idsKey.split(",") : []).then((p) => {
      if (!cancelled) setProducts(p);
    });
    return () => {
      cancelled = true;
    };
  }, [customer, idsKey]);

  if (!customer || products === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-64 animate-pulse rounded-xl bg-paper" />
        <div className="h-64 animate-pulse rounded-xl bg-paper" />
        <div className="h-64 animate-pulse rounded-xl bg-paper" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-paper p-10 text-center">
        <p className="text-muted">{dict.account.wishlist.empty}</p>
        <LocalizedLink
          href="/shop"
          className="mt-4 inline-block rounded-md bg-ink px-5 py-3 text-sm font-bold text-white hover:bg-orange"
        >
          {dict.account.wishlist.browse}
        </LocalizedLink>
      </div>
    );
  }

  const remove = async (productId: string) => {
    setProducts(products.filter((p) => p.id !== productId));
    await toggleWishlist(customer, productId);
    await refreshCustomer();
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <div key={product.id} className="relative">
          <button
            type="button"
            onClick={() => remove(product.id)}
            aria-label={dict.account.wishlist.remove}
            title={dict.account.wishlist.remove}
            className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-sm text-ink-soft hover:border-ink hover:text-ink"
          >
            ✕
          </button>
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
