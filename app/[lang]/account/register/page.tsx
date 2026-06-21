import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { LocalizedLink } from "@/components/localized-link";
import { getCustomer } from "@/lib/data/customer";
import { localePath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const metadata = { robots: { index: false } };

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  if (await getCustomer()) redirect(localePath(lang, "/account"));
  const dict = await getDictionary(lang);

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <LocalizedLink href="/" className="eyebrow text-muted hover:text-orange">
        {dict.account.registerBackToShop}
      </LocalizedLink>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">
        {dict.account.registerTitle}
      </h1>
      <p className="mt-2 text-ink-soft">{dict.account.registerSubtitle}</p>
      <div className="mt-8 rounded-xl border border-line bg-white p-6">
        <AuthForm mode="register" />
      </div>
    </div>
  );
}
