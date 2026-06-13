"use server";

import { revalidatePath } from "next/cache";
import { sdk } from "../medusa";
import { getAuthHeaders } from "../cookies";

export async function getAddresses() {
  const headers = await getAuthHeaders();
  if (!("authorization" in headers)) return [];
  try {
    const { addresses } = await sdk.store.customer.listAddress(
      { limit: 50 } as any,
      headers as any
    );
    return addresses ?? [];
  } catch {
    return [];
  }
}

export type AddressState = { error?: string; ok?: boolean } | null;

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

export async function createAddress(
  _prev: AddressState,
  formData: FormData
): Promise<AddressState> {
  const headers = await getAuthHeaders();
  if (!("authorization" in headers)) return { error: "Please sign in." };

  const body = readAddress(formData);
  if (!body.first_name || !body.address_1 || !body.city || !body.postal_code) {
    return { error: "Name, address, city and postal code are required." };
  }
  try {
    await sdk.store.customer.createAddress(body as any, {}, headers as any);
  } catch (e: any) {
    return { error: e?.message || "Could not save address." };
  }
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { ok: true };
}

export async function updateAddress(
  _prev: AddressState,
  formData: FormData
): Promise<AddressState> {
  const headers = await getAuthHeaders();
  if (!("authorization" in headers)) return { error: "Please sign in." };

  const addressId = String(formData.get("address_id") || "");
  if (!addressId) return { error: "Missing address id." };
  const body = readAddress(formData);
  try {
    await sdk.store.customer.updateAddress(
      addressId,
      body as any,
      {},
      headers as any
    );
  } catch (e: any) {
    return { error: e?.message || "Could not update address." };
  }
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { ok: true };
}

export async function deleteAddress(addressId: string) {
  const headers = await getAuthHeaders();
  if (!("authorization" in headers)) return;
  await sdk.store.customer.deleteAddress(addressId, headers as any);
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
}
