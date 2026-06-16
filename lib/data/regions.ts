import { cache } from "react";
import { sdk } from "../medusa";

export const getRegion = cache(async function getRegion() {
  const { regions } = await sdk.store.region.list();
  if (!regions?.length) {
    throw new Error(
      "No region configured in Medusa. Run the backend setup script first."
    );
  }
  return regions[0];
});
