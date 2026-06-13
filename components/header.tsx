import Link from "next/link";
import { getCart } from "@/lib/data/cart";
import { getCustomer } from "@/lib/data/customer";

const NAV = [
  { label: "Blokees", href: "/category/blokees" },
  { label: "Kamen Rider", href: "/category/kamen-rider" },
  { label: "Ultraman", href: "/category/ultraman" },
  { label: "Pokémon", href: "/category/pokmon-tcg" },
  { label: "Zoids", href: "/category/zoids" },
];

export async function Header() {
  const [cart, customer] = await Promise.all([getCart(), getCustomer()]);
  const count =
    cart?.items?.reduce((n: number, i: any) => n + (i.quantity ?? 0), 0) ?? 0;

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-5 py-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold tracking-tight text-orange">
            MURU
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-6 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-sm font-semibold text-ink-soft transition-colors hover:text-orange"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/account"
            className="hidden text-sm font-semibold text-ink-soft transition-colors hover:text-orange sm:block"
          >
            {customer ? customer.first_name || "Account" : "Sign in"}
          </Link>
          <Link
            href="/cart"
            className="flex items-center gap-2 rounded-md border border-line bg-paper px-3 py-2 text-sm font-semibold transition-colors hover:border-ink"
          >
            <span>Cart</span>
            <span className="flex h-5 min-w-5 items-center justify-center rounded bg-ink px-1 text-xs font-bold text-white">
              {count}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
