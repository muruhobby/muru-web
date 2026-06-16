// Central re-exports of the Medusa store types used across the storefront,
// plus a few derived shapes our data layer returns.

export type {
  StoreProduct,
  StoreProductVariant,
  StoreProductCategory,
  StoreCollection,
  StoreCart,
  StoreCartLineItem,
  StoreCustomer,
  StoreCustomerAddress,
  StoreRegion,
  StoreOrder,
  StoreOrderLineItem,
  StoreCartShippingOption,
} from "@medusajs/types";

/** A category with its product count — what the shop/nav filters consume. */
export type CategoryWithCount = {
  id: string;
  name: string;
  handle: string;
  count: number;
};
