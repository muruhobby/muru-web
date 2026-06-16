import { unstable_cache } from "next/cache";
import { sdk } from "../medusa";
import type { StoreCollection } from "../types";

// Public catalog data — cached in Next's data cache (see lib/data/products.ts).
const CATALOG_REVALIDATE = 300; // seconds

export const listCollections = unstable_cache(
  async function listCollections(): Promise<StoreCollection[]> {
    const { collections } = await sdk.store.collection.list({
      fields: "id,title,handle",
      limit: 50,
    });
    return collections;
  },
  ["collections"],
  { tags: ["collections"], revalidate: CATALOG_REVALIDATE }
);

export const getCollectionByHandle = unstable_cache(
  async function getCollectionByHandle(
    handle: string
  ): Promise<StoreCollection | null> {
    const { collections } = await sdk.store.collection.list({
      handle,
      fields: "id,title,handle",
    });
    return collections[0] ?? null;
  },
  ["collection-by-handle"],
  { tags: ["collections"], revalidate: CATALOG_REVALIDATE }
);
