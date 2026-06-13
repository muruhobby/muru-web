import { sdk } from "../medusa";

export async function listCollections() {
  const { collections } = await sdk.store.collection.list(
    { fields: "id,title,handle", limit: 50 } as any,
    { next: { revalidate: 3600 } } as any
  );
  return collections;
}

export async function getCollectionByHandle(handle: string) {
  const { collections } = await sdk.store.collection.list(
    { handle, fields: "id,title,handle" } as any,
    { next: { revalidate: 3600 } } as any
  );
  return collections[0] ?? null;
}
