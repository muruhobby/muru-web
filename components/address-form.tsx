"use client";

import { useActionState, useEffect } from "react";
import {
  createAddress,
  updateAddress,
  type AddressState,
} from "@/lib/client/addresses";
import { useDict } from "@/components/i18n-provider";
import type { StoreCustomerAddress } from "@/lib/types";

export function AddressForm({
  mode,
  address,
  onDone,
}: {
  mode: "create" | "edit";
  address?: StoreCustomerAddress;
  onDone: () => void;
}) {
  const dict = useDict();
  const [state, formAction, pending] = useActionState<AddressState, FormData>(
    (_prev, formData) =>
      mode === "edit" ? updateAddress(formData) : createAddress(formData),
    null
  );

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-line bg-paper p-5">
      {mode === "edit" && (
        <input type="hidden" name="address_id" defaultValue={address?.id} />
      )}
      <Field name="address_name" label={dict.address.label} defaultValue={address?.address_name} required={false} />
      <div className="grid grid-cols-2 gap-3">
        <Field name="first_name" label={dict.address.firstName} defaultValue={address?.first_name} />
        <Field name="last_name" label={dict.address.lastName} defaultValue={address?.last_name} required={false} />
      </div>
      <Field name="phone" label={dict.address.phone} defaultValue={address?.phone} required={false} />
      <Field name="address_1" label={dict.address.street} defaultValue={address?.address_1} />
      <div className="grid grid-cols-2 gap-3">
        <Field name="city" label={dict.address.city} defaultValue={address?.city} />
        <Field name="province" label={dict.address.province} defaultValue={address?.province} required={false} />
      </div>
      <Field name="postal_code" label={dict.address.postalCode} defaultValue={address?.postal_code} />

      {state?.error && (
        <p className="rounded-md bg-orange/10 px-3 py-2 text-sm text-orange-dark">
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-ink px-5 py-2.5 text-sm font-bold text-white hover:bg-orange disabled:opacity-60"
        >
          {pending
            ? dict.address.saving
            : mode === "edit"
              ? dict.address.saveChanges
              : dict.address.addAddress}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-line px-5 py-2.5 text-sm font-semibold hover:border-ink"
        >
          {dict.address.cancel}
        </button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  required = true,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="eyebrow text-muted">{label}</span>
      <input
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-orange"
      />
    </label>
  );
}
