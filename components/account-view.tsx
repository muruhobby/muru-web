"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/client/customer";
import { LocalizedLink } from "@/components/localized-link";
import { useStore } from "@/components/store-provider";
import { interpolate, localePath } from "@/lib/i18n/config";
import { useDict, useLang } from "@/components/i18n-provider";

export function AccountView() {
  const dict = useDict();
  const lang = useLang();
  const router = useRouter();
  const { customer, customerReady, refreshCustomer } = useStore();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (customerReady && !customer) {
      router.replace(localePath(lang, "/account/login"));
    }
  }, [customerReady, customer, router, lang]);

  if (!customerReady || !customer) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16">
        <div className="h-9 w-64 animate-pulse rounded bg-line" />
        <div className="mt-8 h-40 animate-pulse rounded-xl bg-paper" />
      </div>
    );
  }

  async function signOut() {
    setSigningOut(true);
    await logout();
    await refreshCustomer();
    router.replace(localePath(lang, "/"));
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <p className="eyebrow text-orange">{dict.account.eyebrow}</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
        {interpolate(dict.account.greeting, {
          name: customer.first_name || customer.email,
        })}
      </h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Info label={dict.account.email} value={customer.email} />
        <Info
          label={dict.account.name}
          value={
            [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
            dict.account.nameFallback
          }
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <LocalizedLink
          href="/account/addresses"
          className="rounded-md bg-ink px-5 py-3 text-sm font-bold text-white hover:bg-orange"
        >
          {dict.account.addressBook}
        </LocalizedLink>
        <LocalizedLink
          href="/shop"
          className="rounded-md border border-line px-5 py-3 text-sm font-bold text-ink-soft hover:border-ink"
        >
          {dict.account.continueShopping}
        </LocalizedLink>
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          className="rounded-md border border-line px-5 py-3 text-sm font-bold text-ink-soft hover:border-ink disabled:opacity-60"
        >
          {dict.account.signOut}
        </button>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <p className="eyebrow text-muted">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
