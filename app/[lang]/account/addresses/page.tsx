import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/data/customer";
import { getAddresses } from "@/lib/data/addresses";
import { AddressBook } from "@/components/address-book";
import { LocalizedLink } from "@/components/localized-link";
import { localePath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const metadata = { robots: { index: false } };

export default async function AddressesPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const customer = await getCustomer();
  if (!customer) redirect(localePath(lang, "/account/login"));
  const addresses = await getAddresses();

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <LocalizedLink
        href="/account"
        className="eyebrow text-muted hover:text-orange"
      >
        {dict.account.addressesBack}
      </LocalizedLink>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
        {dict.account.addressesTitle}
      </h1>
      <p className="mt-2 text-ink-soft">{dict.account.addressesSubtitle}</p>

      <div className="mt-8">
        <AddressBook addresses={addresses} />
      </div>
    </div>
  );
}
