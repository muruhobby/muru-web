import "server-only";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, defaultLocale, isLocale, type Locale } from "./config";

/** Read the active locale from the NEXT_LOCALE cookie (set by proxy.ts). */
export async function getLocaleFromCookies(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}
