import type { Metadata } from "next";
import { listProducts } from "@/lib/data/products";
import { ProductCard } from "@/components/product-card";
import { interpolate, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.metadata.searchTitle,
    description: dict.metadata.searchDescription,
    // Query result pages are not useful SEO targets.
    robots: { index: false },
  };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: Locale }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const products = query ? await listProducts({ q: query, limit: 50 }) : [];

  const countLabel =
    products.length === 1
      ? dict.search.resultsCountOne
      : dict.search.resultsCountOther;

  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <p className="eyebrow text-orange">{dict.search.eyebrow}</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
        {query ? (
          <>
            {dict.search.resultsForPrefix}{" "}
            <span className="text-orange">&ldquo;{query}&rdquo;</span>
          </>
        ) : (
          dict.search.titleDefault
        )}
      </h1>
      {query && (
        <p className="mt-2 text-muted">
          {interpolate(countLabel, { count: products.length })}
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
          {interpolate(dict.search.noResults, { query })}
        </p>
      )}

      {!query && <p className="mt-10 text-muted">{dict.search.prompt}</p>}
    </div>
  );
}
