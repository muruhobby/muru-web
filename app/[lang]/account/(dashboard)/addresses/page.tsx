import { AddressBook } from "@/components/address-book";
import { type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

// Static shell; AddressBook fetches the customer's addresses client-side.
export default async function AddressesPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <>
      <h2 className="text-2xl font-extrabold tracking-tight">
        {dict.account.addressesTitle}
      </h2>
      <p className="mt-2 text-ink-soft">{dict.account.addressesSubtitle}</p>
      <div className="mt-6">
        <AddressBook />
      </div>
    </>
  );
}
