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

