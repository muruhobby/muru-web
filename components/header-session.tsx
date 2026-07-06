"use client";

import { LocalizedLink } from "@/components/localized-link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useStore } from "@/components/store-provider";
import { useDict } from "@/components/i18n-provider";

/**
 * The session-dependent corner of the header (account link + cart count).
 * Rendered client-side from the StoreProvider so the header itself — and every
 * page around it — can stay statically rendered.
 */
export function HeaderSession() {
  const dict = useDict();
  const { cart, customer } = useStore();
  const count = cart?.items?.reduce((n, i) => n + (i.quantity ?? 0), 0) ?? 0;

  return (
    <div className="ml-auto flex items-center gap-3 sm:ml-0">
      <LocaleSwitcher />
      <LocalizedLink
        href="/account"
        className="hidden text-sm font-semibold text-ink-soft transition-colors hover:text-orange sm:block"
      >
        {customer ? customer.first_name || dict.nav.account : dict.nav.signIn}
      </LocalizedLink>
      <LocalizedLink
        href="/cart"
        className="flex items-center gap-2 rounded-md border border-line bg-paper px-3 py-2 text-sm font-semibold transition-colors hover:border-ink"
      >
        <span>{dict.nav.cart}</span>
        <span className="flex h-5 min-w-5 items-center justify-center rounded bg-ink px-1 text-xs font-bold text-white">
          {count}
        </span>
      </LocalizedLink>
    </div>
  );
}
