import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductByHandle } from "@/lib/data/products";
import { ProductPurchase } from "@/components/product-purchase";
import { getProductMeta } from "@/lib/util";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) notFound();

  const { badge, categoryLabel, emoji } = getProductMeta(product);

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
          {product.description && (
            <p className="mt-6 max-w-md leading-relaxed text-ink-soft">
              {product.description}
            </p>
          )}

          <ProductPurchase variants={product.variants ?? []} />

          <div className="mt-8 flex gap-6 border-t border-line pt-6 text-sm text-muted">
            <span>✓ 100% authentic</span>
            <span>✓ Fast dispatch</span>
          </div>
        </div>
      </div>
    </div>
  );
}
