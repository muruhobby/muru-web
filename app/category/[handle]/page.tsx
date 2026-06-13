import Link from "next/link";
import { notFound } from "next/navigation";
import { listCategories, listProducts } from "@/lib/data/products";
import { ProductCard } from "@/components/product-card";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const categories = await listCategories();
  const category = categories.find((c: any) => c.handle === handle);
  if (!category) notFound();

  const products = await listProducts({ categoryId: category.id, limit: 50 });

  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <Link href="/shop" className="eyebrow text-muted hover:text-orange">
        ← All products
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
        {category.name}
      </h1>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p: any) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {products.length === 0 && (
        <p className="mt-10 text-muted">No products in this category yet.</p>
      )}
    </div>
  );
}
