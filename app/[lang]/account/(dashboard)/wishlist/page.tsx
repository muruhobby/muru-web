import { WishlistView } from "@/components/wishlist-view";
import { type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

// Static shell; WishlistView resolves the customer's saved product ids
// (customer.metadata.wishlist) to priced products client-side.
export default async function WishlistPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <>
      <h2 className="text-2xl font-extrabold tracking-tight">
        {dict.account.wishlist.title}
      </h2>
      <div className="mt-6">
        <WishlistView />
      </div>
    </>
  );
}
