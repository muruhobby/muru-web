import Link from "next/link";
import { redirect } from "next/navigation";
import { getCart } from "@/lib/data/cart";
import { getCustomer } from "@/lib/data/customer";
import { getAddresses } from "@/lib/data/addresses";
import { CheckoutClient } from "@/components/checkout-client";
import { formatIDR } from "@/lib/util";

export default async function CheckoutPage() {
  const [cart, customer, addresses] = await Promise.all([
    getCart(),
    getCustomer(),
    getAddresses(),
  ]);
  const items = cart?.items ?? [];
  if (!items.length) redirect("/cart");

  const subtotal = (cart as any).item_total ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">Checkout</h1>
      {customer ? (
        <p className="mt-2 text-sm text-muted">
          Signed in as {customer.email}.{" "}
          <Link href="/account/addresses" className="font-semibold text-orange">
            Manage addresses
          </Link>
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted">
          <Link href="/account/login" className="font-semibold text-orange">
            Sign in
          </Link>{" "}
          to use your saved addresses.
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
          <h2 className="font-bold">Your order</h2>
          <div className="mt-4 divide-y divide-line">
            {items.map((i: any) => (
              <div key={i.id} className="flex items-center gap-3 py-3">
                <span className="grid h-10 w-10 place-items-center rounded border border-line bg-paper text-xl">
                  {(i.product?.metadata?.emoji as string) || "📦"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {i.product_title || i.title}
                  </p>
                  <p className="text-xs text-muted">Qty {i.quantity}</p>
                </div>
                <span className="text-sm font-semibold">
                  {formatIDR(i.total ?? i.unit_price * i.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-line pt-4 font-bold">
            <span>Subtotal</span>
            <span>{formatIDR(subtotal)}</span>
          </div>
          <p className="mt-2 text-xs text-muted">
            Shipping calculated from your address via courier (JNE / J&T).
          </p>
        </aside>
      </div>
    </div>
  );
}
