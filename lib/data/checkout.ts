"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sdk } from "../medusa";
import { getAuthHeaders, getCartId, removeCartId } from "../cookies";
import { getErrorMessage } from "../util";
import { localePath } from "../i18n/config";
import { getLocaleFromCookies } from "../i18n/server";
import type { StoreCartShippingOption, StoreOrder } from "../types";

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
      headers
    );

    const { shipping_options } = await sdk.store.fulfillment.listCartOptions(
      { cart_id: cartId },
      headers
    );

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
            { cart_id: cartId },
            {},
            headers
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
      headers
    );

    const { cart } = await sdk.store.cart.retrieve(
      cartId,
      { fields: "*payment_collection" },
      headers
    );
    await sdk.store.payment.initiatePaymentSession(
      cart,
      { provider_id: "pp_system_default" },
      {},
      headers
    );

    const result = await sdk.store.cart.complete(cartId, {}, headers);
    if (result.type === "order") {
      await removeCartId();
      const lang = await getLocaleFromCookies();
      revalidatePath("/[lang]", "layout");
      redirect(localePath(lang, `/order/${result.order.id}`));
    }
    return {
      error: result.error?.message || "Could not complete the order.",
    };
  } catch (e: unknown) {
    if (e instanceof Error && e.message?.includes("NEXT_REDIRECT")) throw e;
    if (
      typeof e === "object" &&
      e !== null &&
      "digest" in e &&
      typeof (e as { digest?: unknown }).digest === "string" &&
      (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw e;
    }
    return { error: getErrorMessage(e, "Checkout failed. Please try again.") };
  }
}

export async function getOrder(orderId: string): Promise<StoreOrder | null> {
  const headers = await getAuthHeaders();
  try {
    const { order } = await sdk.store.order.retrieve(
      orderId,
      {
        fields:
          "*items,*shipping_address,*shipping_methods,+email,+total,+currency_code,+display_id",
      },
      headers
    );
    return order;
  } catch {
    return null;
  }
}
