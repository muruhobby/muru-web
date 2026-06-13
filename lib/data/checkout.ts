"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sdk } from "../medusa";
import { getAuthHeaders, getCartId, removeCartId } from "../cookies";

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
  const cartId = await getCartId();
  if (!cartId) return { error: "Your cart is empty." };
  if (!input.email || !input.first_name || !input.address_1 || !input.city || !input.postal_code) {
    return { error: "Please fill in name, email, address, city and postal code." };
  }
  const headers = await getAuthHeaders();
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
    await sdk.store.cart.update(
      cartId,
      { email: input.email, shipping_address: address, billing_address: address },
      {},
      headers as any
    );

    const { shipping_options } = await sdk.store.fulfillment.listCartOptions(
      { cart_id: cartId } as any,
      headers as any
    );

    if (!shipping_options?.length) {
      return { error: "No shipping options available for this address." };
    }

    // Flat options carry an `amount`; "calculated" options (Biteship couriers)
    // must be priced per-option via the calculate endpoint. Degrade gracefully
    // so one failing courier doesn't hide the others.
    const errors: string[] = [];
    const priced = await Promise.all(
      (shipping_options as any[]).map(async (o) => {
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
          const res: any = await sdk.store.fulfillment.calculate(
            o.id,
            { cart_id: cartId } as any,
            {},
            headers as any
          );
          const so = res?.shipping_option ?? res;
          base.amount =
            so?.calculated_price?.calculated_amount ?? so?.amount ?? null;
        } catch (e: any) {
          errors.push(e?.message || `${o.name} unavailable`);
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
  } catch (e: any) {
    return { error: e?.message || "Could not calculate shipping for this address." };
  }
}

/** Adds the chosen shipping method, initiates payment, and completes the order. */
export async function placeOrder(optionId: string): Promise<{ error?: string }> {
  const cartId = await getCartId();
  if (!cartId) return { error: "Your cart is empty." };
  if (!optionId) return { error: "Please choose a shipping method." };
  const headers = await getAuthHeaders();

  try {
    await sdk.store.cart.addShippingMethod(
      cartId,
      { option_id: optionId },
      {},
      headers as any
    );

    const { cart } = await sdk.store.cart.retrieve(
      cartId,
      { fields: "*payment_collection" } as any,
      headers as any
    );
    await sdk.store.payment.initiatePaymentSession(
      cart as any,
      { provider_id: "pp_system_default" },
      {},
      headers as any
    );

    const result = await sdk.store.cart.complete(cartId, {}, headers as any);
    if (result.type === "order") {
      await removeCartId();
      revalidatePath("/", "layout");
      redirect(`/order/${result.order.id}`);
    }
    return {
      error: (result as any).error?.message || "Could not complete the order.",
    };
  } catch (e: any) {
    if (e?.digest?.startsWith?.("NEXT_REDIRECT")) throw e;
    return { error: e?.message || "Checkout failed. Please try again." };
  }
}

export async function getOrder(orderId: string) {
  const headers = await getAuthHeaders();
  try {
    const { order } = await sdk.store.order.retrieve(
      orderId,
      {
        fields:
          "*items,*shipping_address,*shipping_methods,+email,+total,+currency_code,+display_id",
      } as any,
      headers as any
    );
    return order;
  } catch {
    return null;
  }
}
