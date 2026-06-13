import { redirect } from "next/navigation";
import { getCart } from "@/lib/data/cart";
import { getCustomer } from "@/lib/data/customer";
import { CheckoutForm } from "@/components/checkout-form";
import { formatIDR } from "@/lib/util";

export default async function CheckoutPage() {
  const [cart, customer] = await Promise.all([getCart(), getCustomer()]);
  const items = cart?.items ?? [];
  if (!items.length) redirect("/cart");

  const subtotal = (cart as any).item_total ?? 0;
  const freeShipping = subtotal >= 300000;
  const shipping = freeShipping ? 0 : 20000;

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">Checkout</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
        <div className="rounded-xl border border-line bg-white p-6">
          <CheckoutForm defaultEmail={customer?.email ?? ""} />
        </div>

        <aside className="h-fit rounded-xl border border-line bg-paper p-6">
          <h2 className="font-bold">Order summary</h2>
          <div className="mt-4 divide-y divide-line">
            {items.map((i: any) => (
              <div key={i.id} className="flex items-center gap-3 py-3">
                <span className="grid h-10 w-10 place-items-center rounded border border-line bg-white text-xl">
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

          <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span className="font-semibold">{formatIDR(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Shipping</span>
              <span className="font-semibold">
                {freeShipping ? "FREE" : formatIDR(shipping)}
              </span>
            </div>
          </div>
          <div className="mt-4 flex justify-between border-t border-line pt-4 text-lg font-extrabold">
            <span>Total</span>
            <span>{formatIDR(subtotal + shipping)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
