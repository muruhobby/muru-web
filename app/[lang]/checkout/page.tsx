import { CheckoutView } from "@/components/checkout-view";

export const metadata = { robots: { index: false } };

// Checkout is session data — rendered client-side from the StoreProvider so
// this route stays static and navigations to it are instant.
export default function CheckoutPage() {
  return <CheckoutView />;
}
