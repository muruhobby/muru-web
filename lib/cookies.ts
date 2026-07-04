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

// Order awaiting payment (order-first checkout): set when the cart is
// completed just before redirecting to Midtrans, cleared once the payment is
// confirmed. Lets the processing page find the order without the cart.
const DAY = 60 * 60 * 24;

export async function getPendingOrderId() {
  return (await nextCookies()).get("_medusa_order_id")?.value;
}

export async function setPendingOrderId(id: string) {
  (await nextCookies()).set("_medusa_order_id", id, { ...baseOpts, maxAge: DAY });
}

export async function removePendingOrderId() {
  (await nextCookies()).set("_medusa_order_id", "", { ...baseOpts, maxAge: -1 });
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
