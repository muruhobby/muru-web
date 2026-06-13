"use client";

import { useState, useTransition } from "react";
import { deleteAddress } from "@/lib/data/addresses";
import { AddressForm } from "./address-form";

export function AddressBook({ addresses }: { addresses: any[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-5">
      {addresses.length === 0 && !adding && (
        <p className="rounded-xl border border-dashed border-line bg-paper p-6 text-center text-muted">
          No saved addresses yet.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {addresses.map((a) =>
          editing === a.id ? (
            <div key={a.id} className="sm:col-span-2">
              <AddressForm mode="edit" address={a} onDone={() => setEditing(null)} />
            </div>
          ) : (
            <div
              key={a.id}
              className="flex flex-col rounded-xl border border-line bg-white p-5"
            >
              <p className="eyebrow text-orange">{a.address_name || "Address"}</p>
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
                  Edit
                </button>
                <button
                  disabled={pending}
                  onClick={() => startTransition(() => deleteAddress(a.id))}
                  className="text-sm font-semibold text-muted hover:text-orange disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {adding ? (
        <AddressForm mode="create" onDone={() => setAdding(false)} />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="rounded-md border border-line px-5 py-2.5 text-sm font-bold hover:border-ink"
        >
          + Add address
        </button>
      )}
    </div>
  );
}
