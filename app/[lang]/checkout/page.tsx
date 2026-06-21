import { redirect } from "next/navigation";
import { getCart } from "@/lib/data/cart";
import { getCustomer } from "@/lib/data/customer";
import { getAddresses } from "@/lib/data/addresses";
import { CheckoutClient } from "@/components/checkout-client";
import { LocalizedLink } from "@/components/localized-link";
import { formatIDR } from "@/lib/util";
import { interpolate, localePath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const metadata = { robots: { index: false } };

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const [cart, customer, addresses] = await Promise.all([
    getCart(),
    getCustomer(),
    getAddresses(),
  ]);
  const items = cart?.items ?? [];
  if (!items.length) redirect(localePath(lang, "/cart"));

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
            addresses={addresses}
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
