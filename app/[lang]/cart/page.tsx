import { CartView } from "@/components/cart-view";

export const metadata = { robots: { index: false } };

// The cart is session data — rendered client-side from the StoreProvider so
// this route stays static and navigations to it are instant.
export default function CartPage() {
  return <CartView />;
}
