import { ProfileForm } from "@/components/profile-form";
import { type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

// Static shell; ProfileForm edits the session customer client-side.
export default async function AccountSettingsPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <>
      <h2 className="text-2xl font-extrabold tracking-tight">
        {dict.account.settings.title}
      </h2>
      <div className="mt-6">
        <ProfileForm />
      </div>
    </>
  );
}
