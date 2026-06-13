import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductByHandle } from "@/lib/data/products";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { formatIDR, getProductMeta, getVariantPrice } from "@/lib/util";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) notFound();

  const { badge, categoryLabel, emoji } = getProductMeta(product);
  const price = getVariantPrice(product);
  const variantId = product?.variants?.[0]?.id ?? null;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <Link href="/shop" className="eyebrow text-muted hover:text-orange">
        ← Back to shop
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="grid-bg relative grid h-[420px] place-items-center rounded-2xl border border-line">
          {badge && (
            <span className="eyebrow absolute left-4 top-4 rounded bg-orange px-2 py-1 text-white">
              {badge}
            </span>
          )}
          <span className="text-[10rem] leading-none">{emoji}</span>
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
          <p className="mt-6 text-3xl font-extrabold">
            {price !== null ? formatIDR(price) : "—"}
          </p>

          {product.description && (
            <p className="mt-6 max-w-md leading-relaxed text-ink-soft">
              {product.description}
            </p>
          )}

          <div className="mt-8 flex gap-3">
            <AddToCartButton
              variantId={variantId}
              label="Add to cart"
              className="px-8 py-3.5"
            />
            <Link
              href="/cart"
              className="rounded-md border border-line px-8 py-3.5 text-sm font-semibold hover:border-ink"
            >
              View cart
            </Link>
          </div>

          <div className="mt-8 flex gap-6 border-t border-line pt-6 text-sm text-muted">
            <span>✓ 100% authentic</span>
            <span>✓ Fast dispatch</span>
          </div>
        </div>
      </div>
    </div>
  );
}
