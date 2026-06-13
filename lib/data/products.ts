import { sdk } from "../medusa";
import { getRegion } from "./regions";

const PRODUCT_FIELDS =
  "*variants.calculated_price,*categories,+metadata,*images";

export async function listProducts(opts?: {
  categoryId?: string;
  collectionId?: string;
  limit?: number;
}) {
  const region = await getRegion();
  const { products } = await sdk.store.product.list(
    {
      region_id: region.id,
      fields: PRODUCT_FIELDS,
      limit: opts?.limit ?? 20,
      ...(opts?.categoryId ? { category_id: [opts.categoryId] } : {}),
      ...(opts?.collectionId ? { collection_id: [opts.collectionId] } : {}),
    } as any,
    { next: { revalidate: 60 } } as any
  );
  return products;
}

export async function getProductByHandle(handle: string) {
  const region = await getRegion();
  const { products } = await sdk.store.product.list(
    { handle, region_id: region.id, fields: PRODUCT_FIELDS } as any,
    { next: { revalidate: 60 } } as any
  );
  return products[0] ?? null;
}

/** Categories that actually have products, sorted by size (skips empty ones). */
export async function listCategories() {
  const { product_categories } = await sdk.store.category.list(
    { fields: "id,name,handle,products.id", limit: 100 } as any,
    { next: { revalidate: 300 } } as any
  );
  return (product_categories ?? [])
    .map((c: any) => ({
      id: c.id,
      name: c.name,
      handle: c.handle,
      count: c.products?.length ?? 0,
    }))
    .filter((c: any) => c.count > 0)
    .sort((a: any, b: any) => b.count - a.count);
}

export async function getCategoryByHandle(handle: string) {
  const { product_categories } = await sdk.store.category.list(
    { handle, fields: "id,name,handle" } as any,
    { next: { revalidate: 300 } } as any
  );
  return product_categories?.[0] ?? null;
}

