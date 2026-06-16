import { cookies as nextCookies } from "next/headers";

// Server-only session helpers. Importing next/headers makes this module
// unusable from client components by design.

const WEEK = 60 * 60 * 24 * 7;
const baseOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = (await nextCookies()).get("_medusa_jwt")?.value;
  return token ? { authorization: `Bearer ${token}` } : {};
}

export async function setAuthToken(token: string) {
  (await nextCookies()).set("_medusa_jwt", token, { ...baseOpts, maxAge: WEEK });
}

export async function removeAuthToken() {
  (await nextCookies()).set("_medusa_jwt", "", { ...baseOpts, maxAge: -1 });
}

export async function getCartId() {
  return (await nextCookies()).get("_medusa_cart_id")?.value;
}

export async function setCartId(id: string) {
  (await nextCookies()).set("_medusa_cart_id", id, { ...baseOpts, maxAge: WEEK });
}

export async function removeCartId() {
  (await nextCookies()).set("_medusa_cart_id", "", { ...baseOpts, maxAge: -1 });
}
