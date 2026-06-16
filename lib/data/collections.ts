import { sdk } from "../medusa";
import type { StoreCollection } from "../types";

export async function listCollections(): Promise<StoreCollection[]> {
  const { collections } = await sdk.store.collection.list({
    fields: "id,title,handle",
    limit: 50,
  });
  return collections;
}

export async function getCollectionByHandle(
  handle: string
): Promise<StoreCollection | null> {
  const { collections } = await sdk.store.collection.list({
    handle,
    fields: "id,title,handle",
  });
  return collections[0] ?? null;
}
