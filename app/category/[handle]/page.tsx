import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCategoryByHandle,
  listCategories,
  listProducts,
} from "@/lib/data/products";
import { ProductCard } from "@/components/product-card";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const [category, categories] = await Promise.all([
    getCategoryByHandle(handle),
    listCategories(),
  ]);
  if (!category) notFound();

  const products = await listProducts({ categoryId: category.id, limit: 100 });

  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <Link href="/shop" className="eyebrow text-muted hover:text-orange">
        ← All products
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
        {category.name}
      </h1>

      {/* Category filter row */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/shop"
          className="rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-ink-soft hover:border-ink"
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/category/${c.handle}`}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              c.handle === handle
                ? "bg-orange text-white"
                : "border border-line text-ink-soft hover:border-ink"
            }`}
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

      {products.length === 0 && (
        <p className="mt-10 text-muted">No products in this category yet.</p>
      )}
    </div>
  );
}
