import Link from "next/link";
import { listCategories, listProducts } from "@/lib/data/products";
import { ProductCard } from "@/components/product-card";

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    listProducts({ limit: 50 }),
    listCategories(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <p className="eyebrow text-orange">All products</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Shop</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        <span className="rounded-full bg-orange px-4 py-1.5 text-sm font-semibold text-white">
          All
        </span>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/category/${c.handle}`}
            className="rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-ink-soft hover:border-ink"
          >
            {c.name}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
