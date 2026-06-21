import { redirect } from "next/navigation";
import { getCustomer, logout } from "@/lib/data/customer";
import { LocalizedLink } from "@/components/localized-link";
import { interpolate, localePath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const metadata = { robots: { index: false } };

export default async function AccountPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const customer = await getCustomer();
  if (!customer) redirect(localePath(lang, "/account/login"));

  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <p className="eyebrow text-orange">{dict.account.eyebrow}</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
        {interpolate(dict.account.greeting, {
          name: customer.first_name || customer.email,
        })}
      </h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Info label={dict.account.email} value={customer.email} />
        <Info
          label={dict.account.name}
          value={
            [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
            dict.account.nameFallback
          }
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <LocalizedLink
          href="/account/addresses"
          className="rounded-md bg-ink px-5 py-3 text-sm font-bold text-white hover:bg-orange"
        >
          {dict.account.addressBook}
        </LocalizedLink>
        <LocalizedLink
          href="/shop"
          className="rounded-md border border-line px-5 py-3 text-sm font-bold text-ink-soft hover:border-ink"
        >
          {dict.account.continueShopping}
        </LocalizedLink>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-md border border-line px-5 py-3 text-sm font-bold text-ink-soft hover:border-ink"
          >
            {dict.account.signOut}
          </button>
        </form>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <p className="eyebrow text-muted">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
