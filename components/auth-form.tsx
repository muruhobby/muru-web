"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { login, signup } from "@/lib/client/customer";
import { LocalizedLink } from "./localized-link";
import { useStore } from "@/components/store-provider";
import { localePath } from "@/lib/i18n/config";
import { useDict, useLang } from "@/components/i18n-provider";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const dict = useDict();
  const lang = useLang();
  const router = useRouter();
  const { customer, customerReady, refreshCustomer } = useStore();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Already signed in (or just signed in below) — go to the account page.
  useEffect(() => {
    if (customerReady && customer) {
      router.replace(localePath(lang, "/account"));
    }
  }, [customerReady, customer, router, lang]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    setError(null);
    setPending(true);
    const result =
      mode === "login"
        ? await login(email, password)
        : await signup({
            email,
            password,
            first_name: String(formData.get("first_name") || "").trim(),
            last_name: String(formData.get("last_name") || "").trim(),
          });

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    // Updating the customer triggers the redirect effect above; keep the
    // button disabled until navigation happens.
    await refreshCustomer();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "register" && (
        <div className="grid grid-cols-2 gap-3">
          <Field name="first_name" label={dict.auth.firstName} />
          <Field name="last_name" label={dict.auth.lastName} required={false} />
        </div>
      )}
      <Field name="email" label={dict.auth.email} type="email" />
      <Field name="password" label={dict.auth.password} type="password" />

      {error && (
        <p className="rounded-md bg-orange/10 px-3 py-2 text-sm text-orange-dark">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-ink px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-orange disabled:opacity-60"
      >
        {pending
          ? dict.auth.pleaseWait
          : mode === "login"
            ? dict.auth.signIn
            : dict.auth.createAccount}
      </button>

      <p className="text-center text-sm text-muted">
        {mode === "login" ? (
          <>
            {dict.auth.noAccount}
            <LocalizedLink
              href="/account/register"
              className="font-semibold text-orange"
            >
              {dict.auth.createOne}
            </LocalizedLink>
          </>
        ) : (
          <>
            {dict.auth.haveAccount}
            <LocalizedLink
              href="/account/login"
              className="font-semibold text-orange"
            >
              {dict.auth.signInLink}
            </LocalizedLink>
          </>
        )}
      </p>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = true,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="eyebrow text-muted">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-orange"
      />
    </label>
  );
}
