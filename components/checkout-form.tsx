"use client";

import { useActionState } from "react";
import { placeOrder, type CheckoutState } from "@/lib/data/checkout";

export function CheckoutForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(
    placeOrder,
    null
  );

  return (
    <form action={formAction} className="space-y-5">
      <fieldset className="space-y-4">
        <legend className="eyebrow text-orange">Contact</legend>
        <Field name="email" label="Email" type="email" defaultValue={defaultEmail} />
        <div className="grid grid-cols-2 gap-3">
          <Field name="first_name" label="First name" />
          <Field name="last_name" label="Last name" required={false} />
        </div>
        <Field name="phone" label="Phone" required={false} />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="eyebrow text-orange">Shipping address</legend>
        <Field name="address_1" label="Street address" />
        <div className="grid grid-cols-2 gap-3">
          <Field name="city" label="City" />
          <Field name="province" label="Province" required={false} />
        </div>
        <Field name="postal_code" label="Postal code" required={false} />
      </fieldset>

      {state?.error && (
        <p className="rounded-md bg-orange/10 px-3 py-2 text-sm text-orange-dark">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-orange px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-orange-dark disabled:opacity-60"
      >
        {pending ? "Placing order…" : "Place order — Cash on Delivery"}
      </button>
      <p className="text-center text-xs text-muted">
        No payment now. Pay cash when your order is delivered.
      </p>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = true,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="eyebrow text-muted">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-orange"
      />
    </label>
  );
}
