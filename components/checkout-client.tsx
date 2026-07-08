"use client";

import { useState, useTransition } from "react";
import {
  applyAddressAndGetRates,
  startPayment,
  type ShippingOption,
} from "@/lib/client/checkout";
import { saveAddressToBook } from "@/lib/client/addresses";
import { formatIDR } from "@/lib/util";
import { interpolate } from "@/lib/i18n/config";
import { useDict } from "@/components/i18n-provider";
import type { StoreCustomerAddress } from "@/lib/types";

type Addr = {
  first_name: string;
  last_name: string;
  phone: string;
  address_1: string;
  city: string;
  province: string;
  postal_code: string;
};

const EMPTY: Addr = {
  first_name: "",
  last_name: "",
  phone: "",
  address_1: "",
  city: "",
  province: "",
  postal_code: "",
};

export function CheckoutClient({
  addresses,
  defaultEmail,
  subtotal,
}: {
  addresses: StoreCustomerAddress[];
  defaultEmail: string;
  subtotal: number;
}) {
  const dict = useDict();
  const [email, setEmail] = useState(defaultEmail);
  // "saved" shows the selected address-book entry; "new" shows the blank form.
  const [mode, setMode] = useState<"saved" | "new">(
    addresses.length ? "saved" : "new"
  );
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    (addresses.find((a) => a.is_default_shipping) ?? addresses[0])?.id ?? null
  );
  const [picking, setPicking] = useState(false);
  const [addr, setAddr] = useState<Addr>(EMPTY);
  const [saveToBook, setSaveToBook] = useState(true);
  const [options, setOptions] = useState<ShippingOption[] | null>(null);
  const [optionId, setOptionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const chosen = options?.find((o) => o.id === optionId) ?? null;
  const shippingCost = chosen?.amount ?? 0;

  const selected =
    addresses.find((a) => a.id === selectedAddressId) ?? addresses[0] ?? null;
  const effective = mode === "saved" && selected ? pick(selected) : addr;

  // All address fields + a basic email must be filled before shipping can be priced.
  const addressComplete = Object.values(effective).every((v) => v.trim() !== "");
  const emailComplete = /^\S+@\S+\.\S+$/.test(email.trim());
  const canCalculate = addressComplete && emailComplete;

  // Rates were priced for a specific destination — drop them on any change.
  function resetRates() {
    setOptions(null);
    setOptionId(null);
    setError(null);
  }

  function selectAddress(a: StoreCustomerAddress) {
    setPicking(false);
    if (a.id === selectedAddressId && mode === "saved") return;
    setMode("saved");
    setSelectedAddressId(a.id);
    resetRates();
  }

  function update(field: keyof Addr, value: string) {
    setAddr((p) => ({ ...p, [field]: value }));
    setOptions(null);
    setOptionId(null);
  }

  function calculate() {
    setError(null);
    startTransition(async () => {
      const res = await applyAddressAndGetRates({ ...effective, email });
      if (res.error) {
        setError(res.error);
        setOptions(null);
      } else {
        setOptions(res.options ?? []);
        setOptionId(res.options?.[0]?.id ?? null);
      }
    });
  }

  function submit() {
    if (!optionId) return;
    setError(null);
    startTransition(async () => {
      // Honor the "save to my address book" checkbox now — after startPayment
      // succeeds the browser leaves for Midtrans.
      if (mode === "new" && saveToBook) {
        await saveAddressToBook(addr);
      }
      const res = await startPayment(optionId);
      if (res.error) {
        setError(res.error);
      } else if (res.redirectUrl) {
        // The cart was completed into an order (its id is already cleared from
        // localStorage). Leave the site for the Midtrans hosted payment page —
        // the in-memory cart is dropped on the next mount.
        window.location.href = res.redirectUrl;
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Shipping address */}
      <section className="space-y-4">
        <h2 className="eyebrow text-orange">{dict.checkout.shippingAddress}</h2>
        <Field label={dict.checkout.email} value={email} onChange={setEmail} type="email" />

        {mode === "saved" && selected && (
          <div className="rounded-xl border border-line bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="eyebrow text-orange">
                    {selected.address_name || dict.checkout.addressFallback}
                  </p>
                  {selected.is_default_shipping && (
                    <span className="eyebrow rounded bg-orange/10 px-1.5 py-0.5 text-orange">
                      {dict.checkout.defaultBadge}
                    </span>
                  )}
                </div>
                <p className="mt-2 font-bold">
                  {selected.first_name} {selected.last_name}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  {selected.address_1}
                  <br />
                  {selected.city} {selected.province} {selected.postal_code}
                  <br />
                  {selected.phone}
                </p>
              </div>
              <button
                onClick={() => setPicking((p) => !p)}
                className="shrink-0 text-sm font-semibold text-orange hover:text-orange-dark"
              >
                {dict.checkout.changeAddress}
              </button>
            </div>
          </div>
        )}

        {mode === "saved" && picking && (
          <div className="space-y-2">
            {addresses.map((a) => (
              <button
                key={a.id}
                onClick={() => selectAddress(a)}
                className={`block w-full rounded-xl border p-4 text-left transition-colors ${
                  selectedAddressId === a.id
                    ? "border-orange ring-1 ring-orange"
                    : "border-line hover:border-ink"
                }`}
              >
                <p className="text-sm font-bold">
                  {a.address_name || dict.checkout.addressFallback}
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  {a.first_name} {a.last_name} · {a.address_1}, {a.city}{" "}
                  {a.postal_code}
                </p>
              </button>
            ))}
            <button
              onClick={() => {
                setPicking(false);
                setMode("new");
                resetRates();
              }}
              className="block w-full rounded-xl border border-dashed border-line p-4 text-left text-sm font-bold text-ink-soft hover:border-ink hover:text-ink"
            >
              {dict.checkout.useNewAddress}
            </button>
          </div>
        )}

        {mode === "new" && (
          <>
            {addresses.length > 0 && (
              <button
                onClick={() => {
                  setMode("saved");
                  resetRates();
                }}
                className="text-sm font-semibold text-orange hover:text-orange-dark"
              >
                {dict.checkout.useSavedAddress}
              </button>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label={dict.checkout.firstName} value={addr.first_name} onChange={(v) => update("first_name", v)} />
              <Field label={dict.checkout.lastName} value={addr.last_name} onChange={(v) => update("last_name", v)} />
            </div>
            <Field label={dict.checkout.phone} value={addr.phone} onChange={(v) => update("phone", v)} />
            <Field label={dict.checkout.street} value={addr.address_1} onChange={(v) => update("address_1", v)} />
            <div className="grid grid-cols-2 gap-3">
              <Field label={dict.checkout.city} value={addr.city} onChange={(v) => update("city", v)} />
              <Field label={dict.checkout.province} value={addr.province} onChange={(v) => update("province", v)} />
            </div>
            <Field label={dict.checkout.postalCode} value={addr.postal_code} onChange={(v) => update("postal_code", v)} />

            <label className="flex cursor-pointer items-center gap-3 pt-1">
              <input
                type="checkbox"
                checked={saveToBook}
                onChange={(e) => setSaveToBook(e.target.checked)}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-line bg-white text-transparent transition-colors peer-checked:border-orange peer-checked:bg-orange peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-orange/50"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2.5 7.5 5.5 10.5 11.5 3.5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="text-sm font-bold">
                {dict.checkout.saveToAddressBook}
              </span>
            </label>
          </>
        )}

        <div>
          <button
            onClick={calculate}
            disabled={pending || !canCalculate}
            className="rounded-md bg-ink px-5 py-3 text-sm font-bold text-white hover:bg-orange disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending && !options
              ? dict.checkout.calculating
              : dict.checkout.calculateShipping}
          </button>
          {!canCalculate && (
            <p className="mt-2 text-xs text-muted">{dict.checkout.fillAllFields}</p>
          )}
        </div>
      </section>

      {/* Shipping options */}
      {options && options.length > 0 && (
        <section>
          <h2 className="eyebrow text-orange">{dict.checkout.chooseCourier}</h2>
          <div className="mt-3 space-y-2">
            {options.map((o) => (
              <label
                key={o.id}
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-colors ${
                  optionId === o.id ? "border-orange ring-1 ring-orange" : "border-line"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="ship"
                    checked={optionId === o.id}
                    onChange={() => setOptionId(o.id)}
                    className="accent-orange"
                  />
                  <div>
                    <p className="text-sm font-bold">{o.name}</p>
                    {o.description && (
                      <p className="text-xs text-muted">{o.description}</p>
                    )}
                  </div>
                </div>
                <span className="font-extrabold">
                  {o.amount !== null ? formatIDR(o.amount) : "—"}
                </span>
              </label>
            ))}
          </div>
        </section>
      )}

      {error && (
        <p className="rounded-md bg-orange/10 px-3 py-2 text-sm text-orange-dark">
          {error}
        </p>
      )}

      {/* Totals + place order */}
      {chosen && (
        <section className="rounded-xl border border-line bg-paper p-5">
          <div className="space-y-2 text-sm">
            <Row label={dict.checkout.subtotal} value={formatIDR(subtotal)} />
            <Row
              label={interpolate(dict.checkout.shippingWithCourier, {
                courier: chosen.name,
              })}
              value={formatIDR(shippingCost)}
            />
          </div>
          <div className="mt-3 flex justify-between border-t border-line pt-3 text-lg font-extrabold">
            <span>{dict.checkout.total}</span>
            <span>{formatIDR(subtotal + shippingCost)}</span>
          </div>
          <button
            onClick={submit}
            disabled={pending}
            className="mt-5 w-full rounded-md bg-orange px-5 py-3.5 text-sm font-bold text-white hover:bg-orange-dark disabled:opacity-60"
          >
            {pending ? dict.checkout.redirecting : dict.checkout.confirmAndPay}
          </button>
          <p className="mt-2 text-center text-xs text-muted">
            {dict.checkout.payNote}
          </p>
        </section>
      )}
    </div>
  );
}

function pick(a: StoreCustomerAddress): Addr {
  return {
    first_name: a.first_name ?? "",
    last_name: a.last_name ?? "",
    phone: a.phone ?? "",
    address_1: a.address_1 ?? "",
    city: a.city ?? "",
    province: a.province ?? "",
    postal_code: a.postal_code ?? "",
  };
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="eyebrow text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-orange"
      />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
