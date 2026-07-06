import { OrderView } from "@/components/order-view";

export const metadata = { robots: { index: false } };

// The order is fetched client-side (with the customer's JWT when present) so
// this route stays static.
export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { id } = await params;
  return <OrderView id={id} />;
}
