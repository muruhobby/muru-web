// Customer order history, fetched in the browser; requires a signed-in
// customer (the SDK attaches the stored JWT automatically).

import { sdk } from "../medusa";
import type { StoreOrder } from "../types";

export const ORDERS_PAGE_SIZE = 10;

// Enough to render the history rows (first item + emoji, totals, status pill)
// without dragging in the full order graph.
const ORDER_FIELDS =
  "id,display_id,status,payment_status,fulfillment_status,total,currency_code,created_at," +
  "items.id,items.title,items.product_title,items.quantity,*items.product";

export async function listOrders(
  offset = 0
): Promise<{ orders: StoreOrder[]; count: number }> {
  const token = await sdk.client.getToken();
  if (!token) return { orders: [], count: 0 };
  try {
    const { orders, count } = await sdk.store.order.list({
      limit: ORDERS_PAGE_SIZE,
      offset,
      order: "-created_at",
      fields: ORDER_FIELDS,
    });
    return { orders: orders ?? [], count: count ?? 0 };
  } catch {
    return { orders: [], count: 0 };
  }
}

/**
 * One customer-facing status per order, derived from the fulfillment /
 * payment state (see .claude/orders.md for the order-first payment flow).
 */
export type OrderDisplayStatus =
  | "canceled"
  | "delivered"
  | "shipped"
  | "processing"
  | "awaitingPayment";

export function getOrderDisplayStatus(order: StoreOrder): OrderDisplayStatus {
  if (order.status === "canceled") return "canceled";
  const fulfillment = order.fulfillment_status ?? "";
  if (fulfillment === "delivered" || fulfillment === "partially_delivered") {
    return "delivered";
  }
  if (fulfillment === "shipped" || fulfillment === "partially_shipped") {
    return "shipped";
  }
  // Any captured (or later refunded) payment means the order is being worked on;
  // otherwise it's still waiting on the Midtrans settlement webhook.
  const paid = ["captured", "partially_captured", "refunded", "partially_refunded"];
  return paid.includes(order.payment_status ?? "") ? "processing" : "awaitingPayment";
}
