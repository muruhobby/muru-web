"use client";

import { CartLineItem } from "@/components/cart-line-item";
import { LocalizedLink } from "@/components/localized-link";
import { useStore } from "@/components/store-provider";
import { formatIDR } from "@/lib/util";
import { interpolate } from "@/lib/i18n/config";
import { useDict } from "@/components/i18n-provider";

export function CartView() {
  const dict = useDict();
  const { cart, cartReady } = useStore();
  const items = cart?.items ?? [];

  if (!cartReady) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-12">
        <div className="h-9 w-48 animate-pulse rounded bg-line" />
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="h-64 animate-pulse rounded-xl bg-paper" />
          <div className="h-64 animate-pulse rounded-xl bg-paper" />
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <p className="text-6xl">🛒</p>
        <h1 className="mt-4 text-2xl font-extrabold">{dict.cart.emptyTitle}</h1>
        <p className="mt-2 text-muted">{dict.cart.emptySubtitle}</p>
        <LocalizedLink
          href="/shop"
          className="mt-6 inline-flex rounded-md bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange-dark"
        >
          {dict.cart.browseProducts}
        </LocalizedLink>
      </div>
    );
  }

  const subtotal = cart?.item_total ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">
        {dict.cart.title}
      </h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="divide-y divide-line border-y border-line">
          {[...items]
            .sort((a, b) =>
              String(a.created_at ?? "").localeCompare(String(b.created_at ?? ""))
            )
            .map((item) => (
              <CartLineItem key={item.id} item={item} />
            ))}
        </div>

        <aside className="h-fit rounded-xl border border-line bg-paper p-6">
          <h2 className="font-bold">{dict.cart.orderSummary}</h2>
          <div className="mt-4 space-y-2 text-sm">
            <Row label={dict.cart.subtotal} value={formatIDR(subtotal)} />
            <Row
              label={dict.cart.shipping}
              value={dict.cart.calculatedAtCheckout}
              muted
            />
          </div>
          <div className="mt-4 flex justify-between border-t border-line pt-4 text-lg font-extrabold">
            <span>{dict.cart.total}</span>
            <span>{formatIDR(subtotal)}</span>
          </div>
          <LocalizedLink
            href="/checkout"
            className="mt-6 block rounded-md bg-orange px-6 py-3 text-center text-sm font-bold text-white hover:bg-orange-dark"
          >
            {dict.cart.checkout}
          </LocalizedLink>
          <p className="mt-3 text-center text-xs text-muted">
            {interpolate(dict.cart.freeShipping, { amount: formatIDR(300000) })}
          </p>
        </aside>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className={muted ? "text-muted" : "font-semibold"}>{value}</span>
    </div>
  );
}
