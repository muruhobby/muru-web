"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/client/customer";
import { LocalizedLink } from "@/components/localized-link";
import { useStore } from "@/components/store-provider";
import { interpolate, localePath } from "@/lib/i18n/config";
import { useDict, useLang } from "@/components/i18n-provider";

const NAV_ITEMS = [
  { href: "/account", key: "settings" },
  { href: "/account/addresses", key: "addresses" },
  { href: "/account/orders", key: "orders" },
  { href: "/account/wishlist", key: "wishlist" },
] as const;

/**
 * Shared frame for the signed-in account area: sidebar nav (horizontal scroll
 * row on mobile) + content. Gates all account pages behind the client-side
 * session — redirects to login when signed out.
 */
export function AccountShell({ children }: { children: React.ReactNode }) {
  const dict = useDict();
  const lang = useLang();
  const router = useRouter();
  const pathname = usePathname();
  const { customer, customerReady, refreshCustomer } = useStore();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (customerReady && !customer) {
      router.replace(localePath(lang, "/account/login"));
    }
  }, [customerReady, customer, router, lang]);

  if (!customerReady || !customer) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="h-9 w-64 animate-pulse rounded bg-line" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
          <div className="h-64 animate-pulse rounded-xl bg-paper" />
          <div className="h-96 animate-pulse rounded-xl bg-paper" />
        </div>
      </div>
    );
  }

  async function signOut() {
    setSigningOut(true);
    await logout();
    await refreshCustomer();
    router.replace(localePath(lang, "/"));
  }

  const isActive = (href: string) => {
    const target = localePath(lang, href);
    return href === "/account" ? pathname === target : pathname.startsWith(target);
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr] lg:gap-12">
        <aside>
          <div className="border-b border-line pb-5">
            <p className="eyebrow text-orange">{dict.account.eyebrow}</p>
            <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight">
              {interpolate(dict.account.greeting, {
                name: customer.first_name || customer.email,
              })}
            </h1>
          </div>
          <nav className="mt-4 flex gap-1 overflow-x-auto lg:flex-col lg:gap-0">
            {NAV_ITEMS.map(({ href, key }) => (
              <LocalizedLink
                key={href}
                href={href}
                className={`whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-semibold lg:rounded-none lg:border-l-[3px] lg:px-5 lg:py-3 ${
                  isActive(href)
                    ? "bg-paper text-ink lg:border-orange"
                    : "text-ink-soft hover:text-ink lg:border-transparent"
                }`}
              >
                {dict.account.nav[key]}
              </LocalizedLink>
            ))}
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              className="whitespace-nowrap rounded-md px-4 py-2.5 text-left text-sm font-semibold text-muted hover:text-ink disabled:opacity-60 lg:mt-4 lg:rounded-none lg:border-l-[3px] lg:border-transparent lg:px-5 lg:py-3"
            >
              {dict.account.signOut}
            </button>
          </nav>
        </aside>

        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}
