import { NextResponse, type NextRequest } from "next/server";
import {
  locales,
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  type Locale,
} from "@/lib/i18n/config";

const WEEK = 60 * 60 * 24 * 7;

/** Pick the best supported locale from the Accept-Language header. */
function localeFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { base: tag.split("-")[0].toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { base } of ranked) {
    if (isLocale(base)) return base;
  }
  return null;
}

function detectLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) return cookie;
  return (
    localeFromAcceptLanguage(request.headers.get("accept-language")) ??
    defaultLocale
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = locales.some(
    (locale) =>
      pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );
  if (hasLocale) return NextResponse.next();

  const locale = detectLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  const response = NextResponse.redirect(request.nextUrl);
  response.cookies.set(LOCALE_COOKIE, locale, {
    maxAge: WEEK,
    sameSite: "lax",
    path: "/",
  });
  return response;
}

export const config = {
  // Run on everything except Next internals and files with an extension.
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};
