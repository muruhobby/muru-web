"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sdk } from "../medusa";
import { getAuthHeaders, getCartId, removeCartId } from "../cookies";

const FREE_SHIPPING_THRESHOLD = 300000; // Rp 300.000

export type CheckoutState = { error?: string } | null;

export async function placeOrder(
  _prev: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const cartId = await getCartId();
  if (!cartId) return { error: "Your cart is empty." };
  const headers = await getAuthHeaders();

  const get = (k: string) => String(formData.get(k) || "").trim();
  const email = get("email");
  const first_name = get("first_name");
  const last_name = get("last_name");
  const address_1 = get("address_1");
  const city = get("city");
  const postal_code = get("postal_code");
  const phone = get("phone");
  const province = get("province");

  if (!email || !first_name || !address_1 || !city) {
    return { error: "Please fill in all required fields." };
  }

  const address = {
    first_name,
    last_name,
    address_1,
    city,
    postal_code,
    province,
    phone,
    country_code: "id",
  };

  try {
    // 1. Email + addresses
    await sdk.store.cart.update(
      cartId,
      { email, shipping_address: address, billing_address: address },
      {},
      headers as any
    );

    // 2. Pick a shipping option (free over threshold, else standard)
    const { shipping_options } = await sdk.store.fulfillment.listCartOptions(
      { cart_id: cartId } as any,
      headers as any
    );
    if (!shipping_options?.length) {
      return { error: "No shipping options available for your address." };
    }

    const { cart: current } = await sdk.store.cart.retrieve(
      cartId,
      { fields: "id,item_total,subtotal" } as any,
      headers as any
    );
    const subtotal = (current as any).item_total ?? (current as any).subtotal ?? 0;

    const free = shipping_options.find((o: any) => /free/i.test(o.name));
    const standard = shipping_options.find((o: any) => /standard/i.test(o.name));
    const chosen =
      subtotal >= FREE_SHIPPING_THRESHOLD && free
        ? free
        : standard ?? shipping_options[0];

    await sdk.store.cart.addShippingMethod(
      cartId,
      { option_id: chosen.id },
      {},
      headers as any
    );

    // 3. Initiate payment session (manual / system provider)
    const { cart: cartForPayment } = await sdk.store.cart.retrieve(
      cartId,
      { fields: "*payment_collection" } as any,
      headers as any
    );
    await sdk.store.payment.initiatePaymentSession(
      cartForPayment as any,
      { provider_id: "pp_system_default" },
      {},
      headers as any
    );

    // 4. Complete the cart -> order
    const result = await sdk.store.cart.complete(cartId, {}, headers as any);

    if (result.type === "order") {
      await removeCartId();
      revalidatePath("/", "layout");
      redirect(`/order/${result.order.id}`);
    }

    return {
      error:
        (result as any).error?.message ||
        "Could not complete the order. Please try again.",
    };
  } catch (e: any) {
    // redirect() throws internally — re-throw so Next can handle it.
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
