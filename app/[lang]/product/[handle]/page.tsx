import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getProductByHandle } from "@/lib/data/products";
import { ProductPurchase } from "@/components/product-purchase";
import { LocalizedLink } from "@/components/localized-link";
import { getProductImage, getProductMeta } from "@/lib/util";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { buildAlternates } from "@/lib/i18n/metadata";

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
  const image = getProductImage(product);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <LocalizedLink href="/shop" className="eyebrow text-muted hover:text-orange">
        {dict.product.backToShop}
      </LocalizedLink>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="grid-bg relative grid h-[420px] place-items-center overflow-hidden rounded-2xl border border-line">
          {badge && (
            <span className="eyebrow absolute left-4 top-4 z-10 rounded bg-orange px-2 py-1 text-white">
              {badge}
            </span>
          )}
          {image ? (
            <Image
              src={image}
              alt={product.title ?? ""}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              className="object-contain p-6"
            />
          ) : (
            <span className="text-[10rem] leading-none">{emoji}</span>
          )}
        </div>

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

          <ProductPurchase variants={product.variants ?? []} />

          <div className="mt-8 flex gap-6 border-t border-line pt-6 text-sm text-muted">
            <span>{dict.product.authentic}</span>
            <span>{dict.product.fastDispatch}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
