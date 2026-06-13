"use client";

import { useTransition } from "react";
import { removeLineItem, updateLineItem } from "@/lib/data/cart";
import { formatIDR } from "@/lib/util";

export function CartLineItem({ item }: { item: any }) {
  const [pending, startTransition] = useTransition();
  const emoji = (item.product?.metadata?.emoji as string) || "📦";

  const setQty = (q: number) =>
    startTransition(() => updateLineItem(item.id, q));
  const remove = () => startTransition(() => removeLineItem(item.id));

  return (
    <div
      className={`flex items-center gap-4 py-5 ${pending ? "opacity-50" : ""}`}
    >
      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-line bg-paper text-3xl">
        {emoji}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-bold">{item.product_title || item.title}</h3>
        <p className="text-sm text-muted">{formatIDR(item.unit_price)} each</p>
      </div>

      <div className="flex items-center rounded-md border border-line">
        <button
          onClick={() => setQty(item.quantity - 1)}
          disabled={pending}
          className="px-3 py-1.5 text-sm font-bold hover:text-orange"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-semibold">
          {item.quantity}
        </span>
        <button
          onClick={() => setQty(item.quantity + 1)}
          disabled={pending}
          className="px-3 py-1.5 text-sm font-bold hover:text-orange"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      <div className="w-28 text-right font-extrabold">
        {formatIDR(item.total ?? item.unit_price * item.quantity)}
      </div>

      <button
        onClick={remove}
        disabled={pending}
        className="text-muted hover:text-orange"
        aria-label="Remove item"
      >
        ✕
      </button>
    </div>
  );
}
