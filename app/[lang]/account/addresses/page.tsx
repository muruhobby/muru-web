import { AddressBook } from "@/components/address-book";
import { LocalizedLink } from "@/components/localized-link";
import { type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const metadata = { robots: { index: false } };

// Static shell; AddressBook fetches the customer's addresses client-side and
// redirects to the login page when signed out.
export default async function AddressesPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

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
        <AddressBook />
      </div>
    </div>
  );
}
