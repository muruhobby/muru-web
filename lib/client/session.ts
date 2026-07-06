// Browser-side session state. The cart id and pending-order id live in
// localStorage so the storefront can talk to Medusa directly from the browser
// (the auth JWT is managed by the Medusa SDK itself, also in localStorage).

const CART_ID_KEY = "_medusa_cart_id";
const PENDING_ORDER_KEY = "_medusa_order_id";

function storage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function getCartId(): string | null {
  return storage()?.getItem(CART_ID_KEY) ?? null;
}

export function setCartId(id: string) {
  storage()?.setItem(CART_ID_KEY, id);
}

export function removeCartId() {
  storage()?.removeItem(CART_ID_KEY);
}

// Order awaiting payment (order-first checkout): set when the cart is
// completed just before redirecting to Midtrans, cleared once the payment is
// confirmed. Lets the processing page find the order without the cart.

export function getPendingOrderId(): string | null {
  return storage()?.getItem(PENDING_ORDER_KEY) ?? null;
}

export function setPendingOrderId(id: string) {
  storage()?.setItem(PENDING_ORDER_KEY, id);
}

export function removePendingOrderId() {
  storage()?.removeItem(PENDING_ORDER_KEY);
}
