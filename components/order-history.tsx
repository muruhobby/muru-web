"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getOrderDisplayStatus,
  listOrders,
  type OrderDisplayStatus,
} from "@/lib/client/orders";
import { LocalizedLink } from "@/components/localized-link";
import { useStore } from "@/components/store-provider";
import { formatIDR } from "@/lib/util";
import { interpolate } from "@/lib/i18n/config";
import { useDict, useLang } from "@/components/i18n-provider";
import type { StoreOrder } from "@/lib/types";

const STATUS_STYLES: Record<OrderDisplayStatus, string> = {
  delivered: "bg-green-100 text-green-800",
  shipped: "bg-orange/10 text-orange",
  processing: "bg-paper-2 text-ink-soft",
  awaitingPayment: "bg-paper-2 text-muted",
  canceled: "bg-paper-2 text-muted line-through",
};

export function OrderHistory() {
  const dict = useDict();
  const lang = useLang();
  const { customer } = useStore();
  const [orders, setOrders] = useState<StoreOrder[] | null>(null);
  const [count, setCount] = useState(0);
  const [loadingMore, startLoadMore] = useTransition();

  useEffect(() => {
    if (!customer) return;
    let cancelled = false;
    void listOrders().then((result) => {
      if (cancelled) return;
      setOrders(result.orders);
      setCount(result.count);
    });
    return () => {
      cancelled = true;
    };
  }, [customer]);

  if (!customer || orders === null) {
    return (
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-xl bg-paper" />
        <div className="h-24 animate-pulse rounded-xl bg-paper" />
        <div className="h-24 animate-pulse rounded-xl bg-paper" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-paper p-10 text-center">
        <p className="text-muted">{dict.account.orders.empty}</p>
        <LocalizedLink
          href="/shop"
          className="mt-4 inline-block rounded-md bg-ink px-5 py-3 text-sm font-bold text-white hover:bg-orange"
        >
          {dict.account.orders.browse}
        </LocalizedLink>
      </div>
    );
  }

  const loadMore = () =>
    startLoadMore(async () => {
      const result = await listOrders(orders.length);
      setOrders([...orders, ...result.orders]);
      setCount(result.count);
    });

  const dateFormat = new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const status = getOrderDisplayStatus(order);
        const items = order.items ?? [];
        const first = items[0];
        const title = first ? first.product_title || first.title : "—";
        const extra = items.length - 1;
        return (
          <LocalizedLink
            key={order.id}
            href={`/order/${order.id}`}
            className="flex items-center gap-4 rounded-xl border border-line bg-white p-4 transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] sm:p-5"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-line bg-paper text-2xl">
              {(first?.product?.metadata?.emoji as string) || "📦"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold">
                {title}
                {extra > 0 && (
                  <span className="font-semibold text-muted">
                    {" "}
                    {interpolate(dict.account.orders.moreItems, { count: extra })}
                  </span>
                )}
              </span>
              <span className="eyebrow mt-1 block text-muted">
                #{order.display_id ?? order.id.slice(-8)} ·{" "}
                {dateFormat.format(new Date(order.created_at))}
              </span>
            </span>
            <span className="hidden font-bold sm:block">
              {formatIDR(order.total)}
            </span>
            <span
              className={`eyebrow shrink-0 rounded-full px-3 py-1.5 ${STATUS_STYLES[status]}`}
            >
              {dict.account.orders.status[status]}
            </span>
          </LocalizedLink>
        );
      })}

      {orders.length < count && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          className="w-full rounded-md border border-line px-5 py-3 text-sm font-bold text-ink-soft hover:border-ink disabled:opacity-60"
        >
          {loadingMore
            ? dict.account.orders.loading
            : dict.account.orders.loadMore}
        </button>
      )}
    </div>
  );
}
