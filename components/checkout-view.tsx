"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckoutClient } from "@/components/checkout-client";
import { LocalizedLink } from "@/components/localized-link";
import { useStore } from "@/components/store-provider";
import { listAddresses } from "@/lib/client/addresses";
import { formatIDR } from "@/lib/util";
import { interpolate, localePath } from "@/lib/i18n/config";
import { useDict, useLang } from "@/components/i18n-provider";
import type { StoreCustomerAddress } from "@/lib/types";

export function CheckoutView() {
  const dict = useDict();
  const lang = useLang();
  const router = useRouter();
  const { cart, cartReady, customer, customerReady } = useStore();
  const [fetchedAddresses, setFetchedAddresses] = useState<
    StoreCustomerAddress[] | null
  >(null);

  useEffect(() => {
    if (!customer) return;
    let cancelled = false;
    void listAddresses().then((a) => {
      if (!cancelled) setFetchedAddresses(a);
    });
    return () => {
      cancelled = true;
    };
  }, [customer]);

  // Guests have no saved addresses; customers wait for the fetch.
  const addresses = customer ? fetchedAddresses : [];
  const items = cart?.items ?? [];
  const ready = cartReady && customerReady && addresses !== null;

  useEffect(() => {
    if (ready && !items.length) router.replace(localePath(lang, "/cart"));
  }, [ready, items.length, router, lang]);

  if (!ready || !items.length) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-12">
        <div className="h-9 w-56 animate-pulse rounded bg-line" />
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
          <div className="h-96 animate-pulse rounded-xl bg-paper" />
          <div className="h-64 animate-pulse rounded-xl bg-paper" />
        </div>
      </div>
    );
  }

  const subtotal = cart?.item_total ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">
        {dict.checkout.title}
      </h1>
      {customer ? (
        <p className="mt-2 text-sm text-muted">
          {interpolate(dict.checkout.signedInAs, { email: customer.email })}{" "}
          <LocalizedLink
            href="/account/addresses"
            className="font-semibold text-orange"
          >
            {dict.checkout.manageAddresses}
          </LocalizedLink>
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted">
          <LocalizedLink
            href="/account/login"
            className="font-semibold text-orange"
          >
            {dict.checkout.signIn}
          </LocalizedLink>{" "}
          {dict.checkout.signInSuffix}
        </p>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
        <div>
          <CheckoutClient
            addresses={addresses ?? []}
            defaultEmail={customer?.email ?? ""}
            subtotal={subtotal}
          />
        </div>

        <aside className="h-fit rounded-xl border border-line bg-white p-6">
          <h2 className="font-bold">{dict.checkout.yourOrder}</h2>
          <div className="mt-4 divide-y divide-line">
            {items.map((i) => (
              <div key={i.id} className="flex items-center gap-3 py-3">
                <span className="grid h-10 w-10 place-items-center rounded border border-line bg-paper text-xl">
                  {(i.product?.metadata?.emoji as string) || "📦"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {i.product_title || i.title}
                  </p>
                  <p className="text-xs text-muted">
                    {interpolate(dict.checkout.qty, { qty: i.quantity })}
                  </p>
                </div>
                <span className="text-sm font-semibold">
                  {formatIDR(i.total ?? i.unit_price * i.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-line pt-4 font-bold">
            <span>{dict.checkout.subtotal}</span>
            <span>{formatIDR(subtotal)}</span>
          </div>
          <p className="mt-2 text-xs text-muted">{dict.checkout.shippingNote}</p>
        </aside>
      </div>
    </div>
  );
}
