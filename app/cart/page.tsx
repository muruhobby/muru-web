import Link from "next/link";
import { getCart } from "@/lib/data/cart";
import { CartLineItem } from "@/components/cart-line-item";
import { formatIDR } from "@/lib/util";

export default async function CartPage() {
  const cart = await getCart();
  const items = cart?.items ?? [];

  if (!items.length) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <p className="text-6xl">🛒</p>
        <h1 className="mt-4 text-2xl font-extrabold">Your cart is empty</h1>
        <p className="mt-2 text-muted">
          Find your next build in the shop.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex rounded-md bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange-dark"
        >
          Browse products
        </Link>
      </div>
    );
  }

  const subtotal = cart?.item_total ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">Your cart</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="divide-y divide-line border-y border-line">
          {items
            .sort((a, b) =>
              String(a.created_at ?? "").localeCompare(String(b.created_at ?? ""))
            )
            .map((item) => (
              <CartLineItem key={item.id} item={item} />
            ))}
        </div>

        <aside className="h-fit rounded-xl border border-line bg-paper p-6">
          <h2 className="font-bold">Order summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <Row label="Subtotal" value={formatIDR(subtotal)} />
            <Row label="Shipping" value="Calculated at checkout" muted />
          </div>
          <div className="mt-4 flex justify-between border-t border-line pt-4 text-lg font-extrabold">
            <span>Total</span>
            <span>{formatIDR(subtotal)}</span>
          </div>
          <Link
            href="/checkout"
            className="mt-6 block rounded-md bg-orange px-6 py-3 text-center text-sm font-bold text-white hover:bg-orange-dark"
          >
            Checkout →
          </Link>
          <p className="mt-3 text-center text-xs text-muted">
            Free shipping above {formatIDR(300000)}
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
