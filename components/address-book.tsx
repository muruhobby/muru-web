"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAddress, listAddresses } from "@/lib/client/addresses";
import { AddressForm } from "./address-form";
import { useStore } from "@/components/store-provider";
import { localePath } from "@/lib/i18n/config";
import { useDict, useLang } from "@/components/i18n-provider";
import type { StoreCustomerAddress } from "@/lib/types";

export function AddressBook() {
  const dict = useDict();
  const lang = useLang();
  const router = useRouter();
  const { customer, customerReady } = useStore();
  const [addresses, setAddresses] = useState<StoreCustomerAddress[] | null>(
    null
  );
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (customerReady && !customer) {
      router.replace(localePath(lang, "/account/login"));
    }
  }, [customerReady, customer, router, lang]);

  // Called from event handlers after a mutation; the initial load below sets
  // state from the async callback instead.
  const refresh = useCallback(async () => {
    const a = await listAddresses();
    setAddresses(a);
  }, []);

  useEffect(() => {
    if (!customer) return;
    let cancelled = false;
    void listAddresses().then((a) => {
      if (!cancelled) setAddresses(a);
    });
    return () => {
      cancelled = true;
    };
  }, [customer]);

  if (!customer || addresses === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-40 animate-pulse rounded-xl bg-paper" />
        <div className="h-40 animate-pulse rounded-xl bg-paper" />
      </div>
    );
  }

  const remove = (id: string) =>
    startTransition(async () => {
      await deleteAddress(id);
      await refresh();
    });

  return (
    <div className="space-y-5">
      {addresses.length === 0 && !adding && (
        <p className="rounded-xl border border-dashed border-line bg-paper p-6 text-center text-muted">
          {dict.address.empty}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {addresses.map((a) =>
          editing === a.id ? (
            <div key={a.id} className="sm:col-span-2">
              <AddressForm
                mode="edit"
                address={a}
                onDone={() => {
                  setEditing(null);
                  void refresh();
                }}
              />
            </div>
          ) : (
            <div
              key={a.id}
              className="flex flex-col rounded-xl border border-line bg-white p-5"
            >
              <p className="eyebrow text-orange">
                {a.address_name || dict.address.fallbackLabel}
              </p>
              <p className="mt-2 font-semibold">
                {a.first_name} {a.last_name}
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                {a.address_1}
                <br />
                {a.city} {a.province} {a.postal_code}
                <br />
                {a.phone}
              </p>
              <div className="mt-4 flex gap-3 pt-2">
                <button
                  onClick={() => setEditing(a.id)}
                  className="text-sm font-semibold text-ink-soft hover:text-orange"
                >
                  {dict.address.edit}
                </button>
                <button
                  disabled={pending}
                  onClick={() => remove(a.id)}
                  className="text-sm font-semibold text-muted hover:text-orange disabled:opacity-50"
                >
                  {dict.address.delete}
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {adding ? (
        <AddressForm
          mode="create"
          onDone={() => {
            setAdding(false);
            void refresh();
          }}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="rounded-md border border-line px-5 py-2.5 text-sm font-bold hover:border-ink"
        >
          {dict.address.add}
        </button>
      )}
    </div>
  );
}
