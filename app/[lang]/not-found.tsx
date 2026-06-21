import Link from "next/link";
import { getLocaleFromCookies } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath } from "@/lib/i18n/config";

export default async function NotFound() {
  const lang = await getLocaleFromCookies();
  const dict = await getDictionary(lang);

  return (
    <div className="mx-auto max-w-7xl px-5 py-24 text-center">
      <h1 className="text-3xl font-extrabold tracking-tight">
        {dict.notFound.title}
      </h1>
      <p className="mt-3 text-muted">{dict.notFound.message}</p>
      <Link
        href={localePath(lang, "/")}
        className="mt-8 inline-flex rounded-md bg-orange px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-dark"
      >
        {dict.notFound.backHome}
      </Link>
    </div>
  );
}
