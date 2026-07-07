import { OrderHistory } from "@/components/order-history";
import { type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

// Static shell; OrderHistory fetches the customer's orders client-side.
export default async function OrdersPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <>
      <h2 className="text-2xl font-extrabold tracking-tight">
        {dict.account.orders.title}
      </h2>
      <div className="mt-6">
        <OrderHistory />
      </div>
    </>
  );
}
