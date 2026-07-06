import { AuthForm } from "@/components/auth-form";
import { LocalizedLink } from "@/components/localized-link";
import { type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const metadata = { robots: { index: false } };

// Static page; AuthForm redirects signed-in customers client-side.
export default async function LoginPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <LocalizedLink href="/" className="eyebrow text-muted hover:text-orange">
        {dict.account.loginBackToShop}
      </LocalizedLink>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">
        {dict.account.loginTitle}
      </h1>
      <p className="mt-2 text-ink-soft">{dict.account.loginSubtitle}</p>
      <div className="mt-8 rounded-xl border border-line bg-white p-6">
        <AuthForm mode="login" />
      </div>
    </div>
  );
}
