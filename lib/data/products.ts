import { unstable_cache } from "next/cache";
import type {
  StoreProductListParams,
  StoreProductCategoryListParams,
} from "@medusajs/types";
import { sdk } from "../medusa";
import { getRegion } from "./regions";
import type {
  CategoryWithCount,
  StoreProduct,
  StoreProductCategory,
} from "../types";

const PRODUCT_FIELDS =
  "*variants.calculated_price,*categories,+metadata,*images";

// Catalog data is public (no cookies/headers) and changes infrequently, so we
// cache it in Next's data cache to avoid a Medusa round-trip on every
// navigation. Args are auto-included in the cache key by unstable_cache; the
// tags allow on-demand invalidation via revalidateTag.
const CATALOG_REVALIDATE = 300; // seconds

export const listProducts = unstable_cache(
  async function listProducts(opts?: {
    categoryId?: string;
    collectionId?: string;
    q?: string;
    limit?: number;
  }): Promise<StoreProduct[]> {
    const region = await getRegion();
    const query: StoreProductListParams = {
      region_id: region.id,
      fields: PRODUCT_FIELDS,
      limit: opts?.limit ?? 20,
    };
    if (opts?.categoryId) query.category_id = [opts.categoryId];
    if (opts?.collectionId) query.collection_id = [opts.collectionId];
    if (opts?.q) query.q = opts.q;

    const { products } = await sdk.store.product.list(query);
    return products;
  },
  ["products"],
  { tags: ["products"], revalidate: CATALOG_REVALIDATE }
);

export const getProductByHandle = unstable_cache(
  async function getProductByHandle(
    handle: string
  ): Promise<StoreProduct | null> {
    const region = await getRegion();
    const { products } = await sdk.store.product.list({
      handle,
      region_id: region.id,
      fields: PRODUCT_FIELDS,
    });
    return products[0] ?? null;
  },
  ["product-by-handle"],
  { tags: ["products"], revalidate: CATALOG_REVALIDATE }
);

/** Categories that actually have products, sorted by size (skips empty ones). */
export const listCategories = unstable_cache(
  async function listCategories(): Promise<CategoryWithCount[]> {
    const query: StoreProductCategoryListParams = {
      fields: "id,name,handle,products.id",
      limit: 100,
    };
    const { product_categories } = await sdk.store.category.list(query);
    return (product_categories as StoreProductCategory[])
      .map((c) => ({
        id: c.id,
        name: c.name,
        handle: c.handle,
        count: c.products?.length ?? 0,
      }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count);
  },
  ["categories"],
  { tags: ["categories"], revalidate: CATALOG_REVALIDATE }
);

export const getCategoryByHandle = unstable_cache(
  async function getCategoryByHandle(
    handle: string
  ): Promise<StoreProductCategory | null> {
    const { product_categories } = await sdk.store.category.list({
      handle,
      fields: "id,name,handle",
    });
    return product_categories[0] ?? null;
  },
  ["category-by-handle"],
  { tags: ["categories"], revalidate: CATALOG_REVALIDATE }
);
