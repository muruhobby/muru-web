"use client";

import { useState } from "react";
import { updateProfile } from "@/lib/client/customer";
import { useStore } from "@/components/store-provider";
import { useDict } from "@/components/i18n-provider";
import type { StoreCustomer } from "@/lib/types";

/**
 * Edit the customer's name and phone. Email is shown read-only — the store
 * API doesn't allow customers to change their login email.
 */
export function ProfileForm() {
  // AccountShell only renders children once the session customer exists, so
  // this is just a type guard; it also keys the fields to the signed-in user.
  const { customer } = useStore();
  if (!customer) return null;
  return <ProfileFields key={customer.id} customer={customer} />;
}

function ProfileFields({ customer }: { customer: StoreCustomer }) {
  const dict = useDict();
  const { refreshCustomer } = useStore();
  const [firstName, setFirstName] = useState(customer.first_name ?? "");
  const [lastName, setLastName] = useState(customer.last_name ?? "");
  const [phone, setPhone] = useState(customer.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    const result = await updateProfile({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
    });
    if (result.error) {
      setError(result.error);
    } else {
      await refreshCustomer();
      setSaved(true);
    }
    setSaving(false);
  }

  const fieldClass =
    "mt-1 w-full border-none bg-transparent p-0 font-semibold outline-none placeholder:font-normal placeholder:text-muted";

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block rounded-xl border border-line bg-white p-5">
          <span className="eyebrow text-muted">
            {dict.account.settings.firstName}
          </span>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className={fieldClass}
          />
        </label>
        <label className="block rounded-xl border border-line bg-white p-5">
          <span className="eyebrow text-muted">
            {dict.account.settings.lastName}
          </span>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={fieldClass}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-paper/60 p-5">
          <p className="eyebrow text-muted">{dict.account.settings.email}</p>
          <p className="mt-1 font-semibold text-ink-soft">{customer.email}</p>
        </div>
        <label className="block rounded-xl border border-line bg-white p-5">
          <span className="eyebrow text-muted">
            {dict.account.settings.phone}
          </span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            placeholder="+62 812-3456-7890"
            className={fieldClass}
          />
        </label>
      </div>

      {error && <p className="text-sm font-semibold text-orange">{error}</p>}

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-ink px-5 py-3 text-sm font-bold text-white hover:bg-orange disabled:opacity-60"
        >
          {saving ? dict.account.settings.saving : dict.account.settings.save}
        </button>
        {saved && (
          <span className="text-sm font-semibold text-ink-soft">
            {dict.account.settings.saved}
          </span>
        )}
      </div>
    </form>
  );
}
