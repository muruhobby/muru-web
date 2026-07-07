"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { login, signup } from "@/lib/client/customer";
import { reconcileCartAfterAuth } from "@/lib/client/cart";
import { LocalizedLink } from "./localized-link";
import { useStore } from "@/components/store-provider";
import { localePath } from "@/lib/i18n/config";
import { useDict, useLang } from "@/components/i18n-provider";

/**
 * Where to go after signing in: the page's `?next=` param when it's an
 * internal path (e.g. the checkout gate passes `/checkout`), else the account
 * page. Read from window at navigation time — using useSearchParams would
 * suspend these otherwise-static pages.
 */
function nextPath(): string {
  const next =
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/account";
}

// The query string never changes while the form is mounted (navigation
// remounts it), so there's nothing to subscribe to.
function subscribeNever() {
  return () => {};
}

function readNextQuery(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next ? `?next=${encodeURIComponent(next)}` : "";
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const dict = useDict();
  const lang = useLang();
  const router = useRouter();
  const { customer, customerReady, refreshCart, refreshCustomer } = useStore();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // Carried onto the login/register cross-links so the destination survives
  // switching forms. Read from the URL after hydration — the static shell is
  // prerendered without one (useSearchParams would suspend the whole page).
  const nextQuery = useSyncExternalStore(
    subscribeNever,
    readNextQuery,
    () => ""
  );

  // Already signed in (or just signed in below) — leave the auth page.
  useEffect(() => {
    if (customerReady && customer) {
      router.replace(localePath(lang, nextPath()));
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
    // Join any cart remembered on the account into the one built as a guest
    // before the header/checkout re-render from the refreshed session.
    await reconcileCartAfterAuth();
    await refreshCart();
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
              href={`/account/register${nextQuery}`}
              className="font-semibold text-orange"
            >
              {dict.auth.createOne}
            </LocalizedLink>
          </>
        ) : (
          <>
            {dict.auth.haveAccount}
            <LocalizedLink
              href={`/account/login${nextQuery}`}
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
