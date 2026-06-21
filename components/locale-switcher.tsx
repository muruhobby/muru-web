"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";
import { useLang } from "./i18n-provider";

const WEEK = 60 * 60 * 24 * 7;

export function LocaleSwitcher() {
  const current = useLang();
  const pathname = usePathname();

  // Strip the leading locale segment to get the locale-less path.
  const segments = pathname.split("/");
  const rest = isLocale(segments[1]) ? "/" + segments.slice(2).join("/") : pathname;
  const cleanRest = rest === "/" ? "" : rest.replace(/\/$/, "");

  function persist(locale: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${WEEK};samesite=lax`;
  }

  return (
    <div className="flex items-center gap-1 text-xs font-bold">
      {locales.map((locale, i) => (
        <span key={locale} className="flex items-center gap-1">
          {i > 0 && <span className="text-line">/</span>}
          <Link
            href={`/${locale}${cleanRest}`}
            onClick={() => persist(locale)}
            aria-current={locale === current ? "true" : undefined}
            className={
              locale === current
                ? "text-orange"
                : "text-muted transition-colors hover:text-ink"
            }
          >
            {locale.toUpperCase()}
          </Link>
        </span>
      ))}
    </div>
  );
}
