import Link from "next/link";
import { listCategories, listProducts } from "@/lib/data/products";
import { ProductCard } from "@/components/product-card";
import { formatIDR, getProductMeta, getVariantPrice } from "@/lib/util";

const FEATURES = [
  { title: "Fast dispatch", body: "Orders before 2PM ship same day. Nationwide in 2–5 days." },
  { title: "100% authentic", body: "Factory sealed, sourced directly from official distributors." },
  { title: "Bisa COD", body: "Cash on delivery available across major Indonesian cities." },
  { title: "Builder community", body: "2,000+ collectors on Discord sharing builds and reviews." },
];

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    listProducts({ limit: 12 }),
    listCategories(),
  ]);

  const hero = products[0];
  const heroMeta = hero ? getProductMeta(hero) : null;
  const heroPrice = hero ? getVariantPrice(hero) : null;

  const grid = products.slice(0, 4);
  const wide = products.slice(4, 6);

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-7xl gap-0 lg:grid-cols-2">
          <div className="flex flex-col justify-center px-5 py-12 lg:py-20">
            <p className="eyebrow text-orange">— New Drop — Blokees Series 04</p>
            <h1 className="mt-4 text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
              Collect.
              <br />
              <span className="text-orange">Build.</span>
              <br />
              Display.
            </h1>
            <p className="mt-6 max-w-md text-ink-soft">
              Premium robot model kits, Kamen Rider figures, and collectibles —
              sourced direct, shipped fast, always authentic.
            </p>
            <div className="mt-8 flex gap-3">
              <Link
                href="/shop"
                className="rounded-md bg-orange px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-dark"
              >
                SHOP NOW
              </Link>
              <Link
                href="/shop"
                className="rounded-md border border-line px-6 py-3 text-sm font-bold text-ink transition-colors hover:border-ink"
              >
                BROWSE SERIES
              </Link>
            </div>
            <div className="mt-10 flex gap-10">
              {[
                ["240+", "Products in stock"],
                ["18", "Active series"],
                ["4.9★", "Avg. rating"],
              ].map(([n, l]) => (
                <div key={l}>
                  <div className="text-2xl font-extrabold">{n}</div>
                  <div className="text-xs text-muted">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero showcase card */}
          <div className="relative grid-bg flex items-center justify-center border-l border-line px-5 py-12">
            {hero && (
              <>
                <span className="eyebrow absolute right-5 top-5 rounded bg-orange px-2 py-1 text-white">
                  New Drop
                </span>
                <div className="flex flex-col items-center">
                  <Link
                    href={`/product/${hero.handle}`}
                    className="grid h-64 w-64 place-items-center rounded-2xl border border-line bg-white shadow-[0_8px_40px_rgba(0,0,0,0.08)]"
                  >
                    <span className="text-8xl">{heroMeta?.emoji}</span>
                  </Link>
                  <p className="eyebrow mt-5 text-orange">
                    {hero.title} · {heroMeta?.categoryLabel}
                  </p>
                  <div className="mt-4 rounded-md border border-line bg-white px-4 py-2 text-center">
                    <span className="eyebrow text-orange">In stock</span>
                    <div className="font-bold">{formatIDR(heroPrice)}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Filter row */}
      <section className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto px-5 py-5">
          <span className="eyebrow shrink-0 text-muted">Filter:</span>
          <Link
            href="/shop"
            className="shrink-0 rounded-full bg-orange px-4 py-1.5 text-sm font-semibold text-white"
          >
            All
          </Link>
          {categories.map((c: any) => (
            <Link
              key={c.id}
              href={`/category/${c.handle}`}
              className="shrink-0 rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:border-ink"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {/* New arrivals */}
      <section className="bg-paper">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow text-orange">Featured Drops</p>
              <h2 className="mt-1 text-3xl font-extrabold tracking-tight">
                New arrivals
              </h2>
            </div>
            <Link
              href="/shop"
              className="eyebrow text-ink-soft hover:text-orange"
            >
              View all →
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {grid.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {wide.length > 0 && (
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {wide.map((p: any) => (
                <ProductCard key={p.id} product={p} wide />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="px-5 py-8">
              <div className="mb-3 h-3 w-3 bg-orange" />
              <h3 className="font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Discount banner */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <div className="relative overflow-hidden rounded-2xl bg-ink px-8 py-12 text-white">
            <span className="pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2 text-[10rem] font-extrabold leading-none text-white/5">
              15%
            </span>
            <p className="eyebrow text-orange">Limited offer</p>
            <h2 className="mt-3 max-w-md text-4xl font-extrabold leading-tight">
              First order? Take <span className="text-orange">15% off.</span>
            </h2>
            <Link
              href="/account/register"
              className="mt-6 inline-flex rounded-md bg-orange px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-dark"
            >
              CLAIM DISCOUNT →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
