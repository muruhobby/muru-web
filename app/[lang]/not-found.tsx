"use client";

import { LocalizedLink } from "@/components/localized-link";
import { useDict } from "@/components/i18n-provider";

// Rendered inside the [lang] layout, so the locale and dictionary come from
// the I18nProvider — no cookie read needed.
export default function NotFound() {
  const dict = useDict();

  return (
    <div className="mx-auto max-w-7xl px-5 py-24 text-center">
      <h1 className="text-3xl font-extrabold tracking-tight">
        {dict.notFound.title}
      </h1>
      <p className="mt-3 text-muted">{dict.notFound.message}</p>
      <LocalizedLink
        href="/"
        className="mt-8 inline-flex rounded-md bg-orange px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-dark"
      >
        {dict.notFound.backHome}
      </LocalizedLink>
    </div>
  );
}
