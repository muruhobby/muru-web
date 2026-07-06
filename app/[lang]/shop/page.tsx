import type { Metadata } from "next";
import { listCategories, listProducts } from "@/lib/data/products";
import { ProductCard } from "@/components/product-card";
import { LocalizedLink } from "@/components/localized-link";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { buildAlternates } from "@/lib/i18n/metadata";

// Static page, re-rendered in the background at most every 5 minutes.
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.metadata.shopTitle,
    description: dict.metadata.shopDescription,
    alternates: buildAlternates(lang, "/shop"),
  };
}

export default async function ShopPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const [products, categories] = await Promise.all([
    listProducts({ limit: 50 }),
    listCategories(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <p className="eyebrow text-orange">{dict.shop.eyebrow}</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
        {dict.shop.title}
      </h1>

      <div className="mt-6 flex flex-wrap gap-2">
        <span className="rounded-full bg-orange px-4 py-1.5 text-sm font-semibold text-white">
          {dict.shop.all}
        </span>
        {categories.map((c) => (
          <LocalizedLink
            key={c.id}
            href={`/category/${c.handle}`}
            className="rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-ink-soft hover:border-ink"
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
    </div>
  );
}
