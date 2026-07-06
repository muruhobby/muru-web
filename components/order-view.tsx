"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { getOrder } from "@/lib/client/checkout";
import { LocalizedLink } from "@/components/localized-link";
import { formatIDR } from "@/lib/util";
import { interpolate } from "@/lib/i18n/config";
import { useDict } from "@/components/i18n-provider";
import type { StoreOrder } from "@/lib/types";

export function OrderView({ id }: { id: string }) {
  const dict = useDict();
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getOrder(id).then((o) => {
      if (cancelled) return;
      setOrder(o);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!loaded) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16">
        <div className="h-48 animate-pulse rounded-xl bg-paper" />
        <div className="mt-6 h-64 animate-pulse rounded-xl bg-paper" />
      </div>
    );
  }

  if (!order) notFound();

  const items = order.items ?? [];
  const addr = order.shipping_address;

  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <div className="rounded-xl border border-line bg-white p-8 text-center">
        <p className="text-6xl">✅</p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">
          {dict.order.title}
        </h1>
        <p className="mt-2 text-ink-soft">
          {interpolate(dict.order.thanks, {
            id: order.display_id ?? id.slice(-8),
          })}
        </p>
        <p className="mt-1 text-sm text-muted">
          {interpolate(dict.order.confirmationSent, {
            email: order.email ?? "",
          })}
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-line bg-white p-6">
        <h2 className="eyebrow text-orange">{dict.order.items}</h2>
        <div className="mt-3 divide-y divide-line">
          {items.map((i) => (
            <div key={i.id} className="flex items-center gap-3 py-3">
              <span className="grid h-10 w-10 place-items-center rounded border border-line bg-paper text-xl">
                {(i.product?.metadata?.emoji as string) || "📦"}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  {i.product_title || i.title}
                </p>
                <p className="text-xs text-muted">
                  {interpolate(dict.order.qty, { qty: i.quantity })}
                </p>
              </div>
              <span className="text-sm font-semibold">
                {formatIDR(i.total ?? i.unit_price * i.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between border-t border-line pt-4 text-lg font-extrabold">
          <span>{dict.order.total}</span>
          <span>{formatIDR(order.total)}</span>
        </div>
      </div>

      {addr && (
        <div className="mt-6 rounded-xl border border-line bg-white p-6">
          <h2 className="eyebrow text-orange">{dict.order.shippingTo}</h2>
          <p className="mt-2 text-sm">
            {addr.first_name} {addr.last_name}
            <br />
            {addr.address_1}
            <br />
            {addr.city} {addr.postal_code}
            <br />
            {addr.phone}
          </p>
        </div>
      )}

      <LocalizedLink
        href="/shop"
        className="mt-8 block rounded-md bg-ink px-6 py-3 text-center text-sm font-bold text-white hover:bg-orange"
      >
        {dict.order.continueShopping}
      </LocalizedLink>
    </div>
  );
}
