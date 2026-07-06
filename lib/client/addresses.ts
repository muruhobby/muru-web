// Address book CRUD that runs in the browser; requires a signed-in customer
// (the SDK attaches the stored JWT automatically).

import { sdk } from "../medusa";
import { getErrorMessage } from "../util";
import type { StoreCustomerAddress } from "../types";

export type AddressState = { error?: string; ok?: boolean } | null;

export async function listAddresses(): Promise<StoreCustomerAddress[]> {
  const token = await sdk.client.getToken();
  if (!token) return [];
  try {
    const { addresses } = await sdk.store.customer.listAddress({ limit: 50 });
    return addresses ?? [];
  } catch {
    return [];
  }
}

function readAddress(formData: FormData) {
  const get = (k: string) => String(formData.get(k) || "").trim();
  return {
    address_name: get("address_name") || "Address",
    first_name: get("first_name"),
    last_name: get("last_name"),
    phone: get("phone"),
    address_1: get("address_1"),
    city: get("city"),
    province: get("province"),
    postal_code: get("postal_code"),
    country_code: "id",
  };
}

export async function createAddress(formData: FormData): Promise<AddressState> {
  const body = readAddress(formData);
  if (!body.first_name || !body.address_1 || !body.city || !body.postal_code) {
    return { error: "Name, address, city and postal code are required." };
  }
  try {
    await sdk.store.customer.createAddress(body);
  } catch (e: unknown) {
    return { error: getErrorMessage(e, "Could not save address.") };
  }
  return { ok: true };
}

export async function updateAddress(formData: FormData): Promise<AddressState> {
  const addressId = String(formData.get("address_id") || "");
  if (!addressId) return { error: "Missing address id." };
  const body = readAddress(formData);
  try {
    await sdk.store.customer.updateAddress(addressId, body);
  } catch (e: unknown) {
    return { error: getErrorMessage(e, "Could not update address.") };
  }
  return { ok: true };
}

export async function deleteAddress(addressId: string): Promise<void> {
  await sdk.store.customer.deleteAddress(addressId);
}
