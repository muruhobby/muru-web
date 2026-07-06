// Checkout flow that runs in the browser against the Medusa store API.
// Midtrans secrets never touch the frontend: the backend payment provider
// creates the Snap transaction and hands back only the hosted-payment URL.

import { sdk } from "../medusa";
import {
  getCartId,
  removeCartId,
  getPendingOrderId,
  setPendingOrderId,
  removePendingOrderId,
} from "./session";
import { getErrorMessage } from "../util";
import type { StoreCartShippingOption, StoreOrder } from "../types";

const MIDTRANS_PROVIDER_ID = "pp_midtrans_midtrans";

export type AddressInput = {
  email: string;
  first_name: string;
  last_name?: string;
  phone?: string;
  address_1: string;
  city: string;
  province?: string;
  postal_code: string;
};

export type ShippingOption = {
  id: string;
  name: string;
  amount: number | null;
  description?: string;
};

export type RatesResult = { options?: ShippingOption[]; error?: string };

/**
 * Saves the chosen address on the cart and returns the available shipping
 * options. With the Biteship provider configured, these come back as live
 * courier rates (JNE / J&T) calculated for the destination + cart items.
 */
export async function applyAddressAndGetRates(
  input: AddressInput
): Promise<RatesResult> {
  const cartId = getCartId();
  if (!cartId) return { error: "Your cart is empty." };
  if (!input.email || !input.first_name || !input.address_1 || !input.city || !input.postal_code) {
    return { error: "Please fill in name, email, address, city and postal code." };
  }
  const address = {
    first_name: input.first_name,
    last_name: input.last_name ?? "",
    phone: input.phone ?? "",
    address_1: input.address_1,
    city: input.city,
    province: input.province ?? "",
    postal_code: input.postal_code,
    country_code: "id",
  };

  try {
    await sdk.store.cart.update(cartId, {
      email: input.email,
      shipping_address: address,
      billing_address: address,
    });

    const { shipping_options } = await sdk.store.fulfillment.listCartOptions({
      cart_id: cartId,
    });

    if (!shipping_options?.length) {
      return { error: "No shipping options available for this address." };
    }

    // Flat options carry an `amount`; "calculated" options (Biteship couriers)
    // must be priced per-option via the calculate endpoint. Degrade gracefully
    // so one failing courier doesn't hide the others.
    const errors: string[] = [];
    const priced = await Promise.all(
      shipping_options.map(async (o: StoreCartShippingOption) => {
        const base: ShippingOption = {
          id: o.id,
          name: o.name,
          amount: null,
          description: o.type?.description,
        };
        if (o.price_type !== "calculated" && o.amount != null) {
          return { ...base, amount: o.amount };
        }
        try {
          const { shipping_option } = await sdk.store.fulfillment.calculate(
            o.id,
            { cart_id: cartId }
          );
          base.amount =
            shipping_option?.calculated_price?.calculated_amount ??
            shipping_option?.amount ??
            null;
        } catch (e: unknown) {
          errors.push(getErrorMessage(e, `${o.name} unavailable`));
        }
        return base;
      })
    );

    const options = priced.filter((o) => o.amount != null);
    if (!options.length) {
      // The provider error is masked by Medusa as a generic 500; keep the
      // customer-facing message neutral (common causes: unrecognized postal
      // code, or the courier account needs a balance top-up).
      if (errors.length) console.error("Shipping rate errors:", errors);
      return {
        error:
          "Couldn't calculate shipping for this address. Please double-check your postal code and try again.",
      };
    }
    return { options };
  } catch (e: unknown) {
    return {
      error: getErrorMessage(e, "Could not calculate shipping for this address."),
    };
  }
}

/**
 * Order-first checkout. Locks in the chosen shipping method, initiates the
 * Midtrans payment session (the backend provider creates the Snap transaction
 * and returns the hosted-payment redirect URL), then **completes the cart so
 * the Medusa order exists before the customer leaves for Midtrans**. The order
 * starts with its payment authorized-but-unpaid; the settlement webhook
 * captures it, flipping the order to paid.
 */
export async function startPayment(
  optionId: string
): Promise<{ redirectUrl?: string; error?: string }> {
  const cartId = getCartId();
  if (!cartId) return { error: "Your cart is empty." };
  if (!optionId) return { error: "Please choose a shipping method." };

  try {
    await sdk.store.cart.addShippingMethod(cartId, { option_id: optionId });

    const { cart } = await sdk.store.cart.retrieve(cartId, {
      fields: "*payment_collection",
    });

    const { payment_collection } = await sdk.store.payment.initiatePaymentSession(
      cart,
      { provider_id: MIDTRANS_PROVIDER_ID }
    );

    const session =
      payment_collection?.payment_sessions?.find(
        (s) => s.provider_id === MIDTRANS_PROVIDER_ID
      ) ?? payment_collection?.payment_sessions?.[0];
    const redirectUrl = (session?.data as { redirect_url?: string } | undefined)
      ?.redirect_url;

    if (!redirectUrl) {
      return { error: "Could not start payment. Please try again." };
    }

    // Create the order now, before the redirect. The Midtrans provider
    // authorizes pending transactions, so completion succeeds pre-payment.
    const result = await sdk.store.cart.complete(cartId);
    if (result.type !== "order") {
      return {
        error: result.error?.message || "Could not place the order. Please try again.",
      };
    }

    removeCartId();
    setPendingOrderId(result.order.id);
    return { redirectUrl };
  } catch (e: unknown) {
    return {
      error: getErrorMessage(e, "Could not start payment. Please try again."),
    };
  }
}

type CheckoutStatus = { status: string; order_id?: string; paid?: boolean };

/**
 * Polled by the processing page. The order already exists (created before the
 * Midtrans redirect); this asks the backend whether its payment has been
 * captured yet (the settlement webhook does that). Once paid, clears the
 * pending-order id and returns the order id so the client can redirect to the
 * confirmation page.
 */
export async function checkPaymentStatus(): Promise<{
  orderId?: string;
  pending?: boolean;
}> {
  const orderId = getPendingOrderId();
  if (orderId) {
    try {
      const result = await sdk.client.fetch<CheckoutStatus>(
        "/store/checkout/status",
        { query: { order_id: orderId } }
      );
      if (result.order_id && result.paid) {
        removePendingOrderId();
        return { orderId: result.order_id };
      }
    } catch {
      // Treat any error as "still pending"; the webhook will capture it.
    }
    return { pending: true };
  }

  // Fallback for payments started before the order-first flow, where the cart
  // id survived the redirect and the webhook creates the order.
  const cartId = getCartId();
  if (!cartId) return { pending: true };
  try {
    const result = await sdk.client.fetch<CheckoutStatus>(
      "/store/checkout/status",
      { query: { cart_id: cartId } }
    );
    if (result.order_id && result.paid !== false) {
      removeCartId();
      return { orderId: result.order_id };
    }
  } catch {
    // Still pending.
  }
  return { pending: true };
}

export async function getOrder(orderId: string): Promise<StoreOrder | null> {
  try {
    const { order } = await sdk.store.order.retrieve(orderId, {
      fields:
        "*items,*shipping_address,*shipping_methods,+email,+total,+currency_code,+display_id",
    });
    return order;
  } catch {
    return null;
  }
}
