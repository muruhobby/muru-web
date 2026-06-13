import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder } from "@/lib/data/checkout";
import { formatIDR } from "@/lib/util";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const items = (order as any).items ?? [];
  const addr = (order as any).shipping_address;

  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <div className="rounded-xl border border-line bg-white p-8 text-center">
        <p className="text-6xl">✅</p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">
          Order confirmed
        </h1>
        <p className="mt-2 text-ink-soft">
          Thanks! Your order{" "}
          <span className="font-bold text-ink">
            #{(order as any).display_id ?? id.slice(-8)}
          </span>{" "}
          is being prepared.
        </p>
        <p className="mt-1 text-sm text-muted">
          A confirmation was sent to {(order as any).email}.
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-line bg-white p-6">
        <h2 className="eyebrow text-orange">Items</h2>
        <div className="mt-3 divide-y divide-line">
          {items.map((i: any) => (
            <div key={i.id} className="flex items-center gap-3 py-3">
              <span className="grid h-10 w-10 place-items-center rounded border border-line bg-paper text-xl">
                {(i.product?.metadata?.emoji as string) || "📦"}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold">
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
        <div className="mt-4 flex justify-between border-t border-line pt-4 text-lg font-extrabold">
          <span>Total</span>
          <span>{formatIDR((order as any).total)}</span>
        </div>
      </div>

      {addr && (
        <div className="mt-6 rounded-xl border border-line bg-white p-6">
          <h2 className="eyebrow text-orange">Shipping to</h2>
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

      <Link
        href="/shop"
        className="mt-8 block rounded-md bg-ink px-6 py-3 text-center text-sm font-bold text-white hover:bg-orange"
      >
        Continue shopping
      </Link>
    </div>
  );
}
