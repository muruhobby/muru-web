"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { localePath } from "@/lib/i18n/config";
import { useLang } from "./i18n-provider";

type LinkProps = ComponentProps<typeof Link>;

/**
 * Drop-in replacement for next/link that prefixes internal absolute paths
 * (e.g. "/shop") with the active locale. External/relative/hash links pass through.
 */
export function LocalizedLink({ href, ...props }: LinkProps) {
  const lang = useLang();
  const localized =
    typeof href === "string" && href.startsWith("/")
      ? localePath(lang, href)
      : href;
  return <Link href={localized} {...props} />;
}
