import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCategoryByHandle,
  listCategories,
  listProducts,
} from "@/lib/data/products";
import { ProductCard } from "@/components/product-card";
import { LocalizedLink } from "@/components/localized-link";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { buildAlternates } from "@/lib/i18n/metadata";

// ISR: rendered on first request, then served statically and refreshed in the
// background at most every 5 minutes.
export const revalidate = 300;

export function generateStaticParams(): { handle: string }[] {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; handle: string }>;
}): Promise<Metadata> {
  const { lang, handle } = await params;
  if (!isLocale(lang)) return {};
  const category = await getCategoryByHandle(handle);
  if (!category) return {};
  return {
    title: category.name,
    alternates: buildAlternates(lang, `/category/${handle}`),
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ lang: Locale; handle: string }>;
}) {
  const { lang, handle } = await params;
  const dict = await getDictionary(lang);
  const [category, categories] = await Promise.all([
    getCategoryByHandle(handle),
    listCategories(),
  ]);
  if (!category) notFound();

  const products = await listProducts({ categoryId: category.id, limit: 100 });

  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <LocalizedLink href="/shop" className="eyebrow text-muted hover:text-orange">
        {dict.category.backToShop}
      </LocalizedLink>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
        {category.name}
      </h1>

      {/* Category filter row */}
      <div className="mt-6 flex flex-wrap gap-2">
        <LocalizedLink
          href="/shop"
          className="rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-ink-soft hover:border-ink"
        >
          {dict.category.all}
        </LocalizedLink>
        {categories.map((c) => (
          <LocalizedLink
            key={c.id}
            href={`/category/${c.handle}`}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              c.handle === handle
                ? "bg-orange text-white"
                : "border border-line text-ink-soft hover:border-ink"
            }`}
          >
            {c.name}
          </LocalizedLink>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {products.length === 0 && (
        <p className="mt-10 text-muted">{dict.category.empty}</p>
      )}
    </div>
  );
}
