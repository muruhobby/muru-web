import type { Metadata } from "next";
import Image from "next/image";
import { listProducts } from "@/lib/data/products";
import { listCollections } from "@/lib/data/collections";
import { ProductCard } from "@/components/product-card";
import { LocalizedLink } from "@/components/localized-link";
import {
  formatIDR,
  getProductImage,
  getProductMeta,
  getVariantPrice,
} from "@/lib/util";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { buildAlternates } from "@/lib/i18n/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { alternates: buildAlternates(lang, "/") };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const [products, collections] = await Promise.all([
    listProducts({ limit: 12 }),
    listCollections(),
  ]);

  const hero = products[0];
  const heroMeta = hero ? getProductMeta(hero) : null;
  const heroPrice = hero ? getVariantPrice(hero) : null;
  const heroImage = hero ? getProductImage(hero) : null;

  const grid = products.slice(0, 4);
  const wide = products.slice(4, 6);

  const stats = [
    ["240+", dict.home.statInStock],
    ["18", dict.home.statActiveSeries],
    ["4.9★", dict.home.statAvgRating],
  ] as const;

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-7xl gap-0 lg:grid-cols-2">
          <div className="flex flex-col justify-center px-5 py-12 lg:py-20">
            <p className="eyebrow text-orange">{dict.home.heroEyebrow}</p>
            <h1 className="mt-4 text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
              {dict.home.heroTitle1}
              <br />
              <span className="text-orange">{dict.home.heroTitle2}</span>
              <br />
              {dict.home.heroTitle3}
            </h1>
            <p className="mt-6 max-w-md text-ink-soft">
              {dict.home.heroDescription}
            </p>
            <div className="mt-8 flex gap-3">
              <LocalizedLink
                href="/shop"
                className="rounded-md bg-orange px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-dark"
              >
                {dict.home.shopNow}
              </LocalizedLink>
              <LocalizedLink
                href="/shop"
                className="rounded-md border border-line px-6 py-3 text-sm font-bold text-ink transition-colors hover:border-ink"
              >
                {dict.home.browseSeries}
              </LocalizedLink>
            </div>
            <div className="mt-10 flex gap-10">
              {stats.map(([n, l]) => (
                <div key={l}>
                  <div className="text-2xl font-extrabold">{n}</div>
                  <div className="text-xs text-muted">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero showcase card */}
          <div className="relative grid-bg flex items-center justify-center border-l border-line px-5 py-12">
            {hero && (
              <>
                <span className="eyebrow absolute right-5 top-5 rounded bg-orange px-2 py-1 text-white">
                  {dict.home.newDrop}
                </span>
                <div className="flex flex-col items-center">
                  <LocalizedLink
                    href={`/product/${hero.handle}`}
                    className="relative grid h-64 w-64 place-items-center overflow-hidden rounded-2xl border border-line bg-white shadow-[0_8px_40px_rgba(0,0,0,0.08)]"
                  >
                    {heroImage ? (
                      <Image
                        src={heroImage}
                        alt={hero.title ?? ""}
                        fill
                        sizes="256px"
                        priority
                        className="object-contain p-5"
                      />
                    ) : (
                      <span className="text-8xl">{heroMeta?.emoji}</span>
                    )}
                  </LocalizedLink>
                  <p className="eyebrow mt-5 text-orange">
                    {hero.title} · {heroMeta?.categoryLabel}
                  </p>
                  <div className="mt-4 rounded-md border border-line bg-white px-4 py-2 text-center">
                    <span className="eyebrow text-orange">{dict.home.inStock}</span>
                    <div className="font-bold">{formatIDR(heroPrice)}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Filter row */}
      <section className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto px-5 py-5">
          <span className="eyebrow shrink-0 text-muted">{dict.home.filter}</span>
          <LocalizedLink
            href="/shop"
            className="shrink-0 rounded-full bg-orange px-4 py-1.5 text-sm font-semibold text-white"
          >
            {dict.home.all}
          </LocalizedLink>
          {collections.map((c) => (
            <LocalizedLink
              key={c.id}
              href={`/collection/${c.handle}`}
              className="shrink-0 rounded-full border border-line px-4 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:border-ink"
            >
              {c.title}
            </LocalizedLink>
          ))}
        </div>
      </section>

      {/* New arrivals */}
      <section className="bg-paper">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow text-orange">{dict.home.featuredDrops}</p>
              <h2 className="mt-1 text-3xl font-extrabold tracking-tight">
                {dict.home.newArrivals}
              </h2>
            </div>
            <LocalizedLink
              href="/shop"
              className="eyebrow text-ink-soft hover:text-orange"
            >
              {dict.home.viewAll}
            </LocalizedLink>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {grid.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {wide.length > 0 && (
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {wide.map((p) => (
                <ProductCard key={p.id} product={p} wide />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {dict.home.features.map((f) => (
            <div key={f.title} className="px-5 py-8">
              <div className="mb-3 h-3 w-3 bg-orange" />
              <h3 className="font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Discount banner */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <div className="relative overflow-hidden rounded-2xl bg-ink px-8 py-12 text-white">
            <span className="pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2 text-[10rem] font-extrabold leading-none text-white/5">
              15%
            </span>
            <p className="eyebrow text-orange">{dict.home.limitedOffer}</p>
            <h2 className="mt-3 max-w-md text-4xl font-extrabold leading-tight">
              {dict.home.discountLead}{" "}
              <span className="text-orange">{dict.home.discountAccent}</span>
            </h2>
            <LocalizedLink
              href="/account/register"
              className="mt-6 inline-flex rounded-md bg-orange px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-dark"
            >
              {dict.home.claimDiscount}
            </LocalizedLink>
          </div>
        </div>
      </section>
    </div>
  );
}
