import type { Metadata } from "next";
import { locales, defaultLocale, localePath, type Locale } from "./config";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * Build canonical + hreflang alternates for a page.
 * `path` is the locale-less app path, e.g. "/shop" or "/product/foo".
 */
export function buildAlternates(
  lang: Locale,
  path: string
): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = localePath(l, path);
  languages["x-default"] = localePath(defaultLocale, path);

  return {
    canonical: localePath(lang, path),
    languages,
  };
}
