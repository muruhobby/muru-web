import { listProducts } from "@/lib/data/products";
import { ProductCard } from "@/components/product-card";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const products = query ? await listProducts({ q: query, limit: 50 }) : [];

  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <p className="eyebrow text-orange">Search</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
        {query ? (
          <>
            Results for{" "}
            <span className="text-orange">&ldquo;{query}&rdquo;</span>
          </>
        ) : (
          "Search products"
        )}
      </h1>
      {query && (
        <p className="mt-2 text-muted">
          {products.length} {products.length === 1 ? "product" : "products"}{" "}
          found
        </p>
      )}

      {products.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {query && products.length === 0 && (
        <p className="mt-10 text-muted">
          No products match &ldquo;{query}&rdquo;. Try a different keyword.
        </p>
      )}

      {!query && (
        <p className="mt-10 text-muted">
          Type a keyword in the search bar to find products.
        </p>
      )}
    </div>
  );
}
