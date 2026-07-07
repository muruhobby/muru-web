"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isInWishlist, toggleWishlist } from "@/lib/client/wishlist";
import { useStore } from "@/components/store-provider";
import { localePath } from "@/lib/i18n/config";
import { useDict, useLang } from "@/components/i18n-provider";

/** Heart toggle on the product page; signed-out clicks go to login. */
export function WishlistButton({ productId }: { productId: string }) {
  const dict = useDict();
  const lang = useLang();
  const router = useRouter();
  const { customer, refreshCustomer } = useStore();
  const [pending, setPending] = useState(false);
  const saved = isInWishlist(customer, productId);

  async function toggle() {
    if (!customer) {
      router.push(localePath(lang, "/account/login"));
      return;
    }
    setPending(true);
    try {
      await toggleWishlist(customer, productId);
      await refreshCustomer();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      className={`flex items-center gap-2 rounded-md border px-4 py-3.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
        saved
          ? "border-orange bg-orange/5 text-orange"
          : "border-line text-ink-soft hover:border-ink"
      }`}
    >
      <span aria-hidden>{saved ? "♥" : "♡"}</span>
      {saved ? dict.wishlist.saved : dict.wishlist.save}
    </button>
  );
}
