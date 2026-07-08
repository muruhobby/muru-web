import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductByHandle } from "@/lib/data/products";
import { ProductGallery } from "@/components/product-gallery";
import { ProductPurchase } from "@/components/product-purchase";
import { LocalizedLink } from "@/components/localized-link";
import { getProductMeta } from "@/lib/util";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { buildAlternates } from "@/lib/i18n/metadata";

// ISR: each product page is rendered on first request, then served statically
// and refreshed in the background at most every 5 minutes.
export const revalidate = 300;

export function generateStaticParams(): { handle: string }[] {
  // No prerender at build time (the Medusa backend may not be running);
  // pages are generated on demand and cached.
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; handle: string }>;
}): Promise<Metadata> {
  const { lang, handle } = await params;
  if (!isLocale(lang)) return {};
  const product = await getProductByHandle(handle);
  if (!product) return {};
  return {
    title: product.title,
    description: product.subtitle ?? product.description ?? undefined,
    alternates: buildAlternates(lang, `/product/${handle}`),
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ lang: Locale; handle: string }>;
}) {
  const { lang, handle } = await params;
  const dict = await getDictionary(lang);
  const product = await getProductByHandle(handle);
  if (!product) notFound();

  const { badge, categoryLabel, emoji } = getProductMeta(product);
  const images = (product.images ?? [])
    .map((img) => img.url)
    .filter((url): url is string => Boolean(url));

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <LocalizedLink href="/shop" className="eyebrow text-muted hover:text-orange">
        {dict.product.backToShop}
      </LocalizedLink>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <ProductGallery
          images={images}
          alt={product.title ?? ""}
          emoji={emoji}
          badge={badge}
        />

        <div className="flex flex-col justify-center">
          {categoryLabel && (
            <p className="eyebrow text-orange">{categoryLabel}</p>
          )}
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
            {product.title}
          </h1>
          {product.subtitle && (
            <p className="mt-2 text-lg text-muted">{product.subtitle}</p>
          )}
          {product.description && (
            <p className="mt-6 max-w-md leading-relaxed text-ink-soft">
              {product.description}
            </p>
          )}

          <ProductPurchase
            productId={product.id}
            variants={product.variants ?? []}
          />

          <div className="mt-8 flex gap-6 border-t border-line pt-6 text-sm text-muted">
            <span>{dict.product.authentic}</span>
            <span>{dict.product.fastDispatch}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
