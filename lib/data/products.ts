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

export async function listProducts(opts?: {
  categoryId?: string;
  collectionId?: string;
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

  const { products } = await sdk.store.product.list(query);
  return products;
}

export async function getProductByHandle(
  handle: string
): Promise<StoreProduct | null> {
  const region = await getRegion();
  const { products } = await sdk.store.product.list({
    handle,
    region_id: region.id,
    fields: PRODUCT_FIELDS,
  });
  return products[0] ?? null;
}

/** Categories that actually have products, sorted by size (skips empty ones). */
export async function listCategories(): Promise<CategoryWithCount[]> {
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
}

export async function getCategoryByHandle(
  handle: string
): Promise<StoreProductCategory | null> {
  const { product_categories } = await sdk.store.category.list({
    handle,
    fields: "id,name,handle",
  });
  return product_categories[0] ?? null;
}
