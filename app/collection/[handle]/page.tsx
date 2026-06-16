import Link from "next/link";
import { notFound } from "next/navigation";
import { getCollectionByHandle } from "@/lib/data/collections";
import { listProducts } from "@/lib/data/products";
import { ProductCard } from "@/components/product-card";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const collection = await getCollectionByHandle(handle);
  if (!collection) notFound();

  const products = await listProducts({
    collectionId: collection.id,
    limit: 50,
  });

  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <Link href="/shop" className="eyebrow text-muted hover:text-orange">
        ← All products
      </Link>
      <p className="mt-3 eyebrow text-orange">Collection</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
        {collection.title}
      </h1>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {products.length === 0 && (
        <p className="mt-10 text-muted">
          No products in this collection yet. Assign products to it in Medusa
          admin.
        </p>
      )}
    </div>
  );
}
