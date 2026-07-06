import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCollectionByHandle } from "@/lib/data/collections";
import { listProducts } from "@/lib/data/products";
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
  const collection = await getCollectionByHandle(handle);
  if (!collection) return {};
  return {
    title: collection.title,
    alternates: buildAlternates(lang, `/collection/${handle}`),
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ lang: Locale; handle: string }>;
}) {
  const { lang, handle } = await params;
  const dict = await getDictionary(lang);
  const collection = await getCollectionByHandle(handle);
  if (!collection) notFound();

  const products = await listProducts({
    collectionId: collection.id,
    limit: 50,
  });

  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <LocalizedLink href="/shop" className="eyebrow text-muted hover:text-orange">
        {dict.collection.backToShop}
      </LocalizedLink>
      <p className="mt-3 eyebrow text-orange">{dict.collection.eyebrow}</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
        {collection.title}
      </h1>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {products.length === 0 && (
        <p className="mt-10 text-muted">{dict.collection.empty}</p>
      )}
    </div>
  );
}
