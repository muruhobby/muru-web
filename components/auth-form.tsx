"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup, type AuthState } from "@/lib/data/customer";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const action = mode === "login" ? login : signup;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      {mode === "register" && (
        <div className="grid grid-cols-2 gap-3">
          <Field name="first_name" label="First name" />
          <Field name="last_name" label="Last name" required={false} />
        </div>
      )}
      <Field name="email" label="Email" type="email" />
      <Field name="password" label="Password" type="password" />

      {state?.error && (
        <p className="rounded-md bg-orange/10 px-3 py-2 text-sm text-orange-dark">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-ink px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-orange disabled:opacity-60"
      >
        {pending
          ? "Please wait…"
          : mode === "login"
            ? "Sign in"
            : "Create account"}
      </button>

      <p className="text-center text-sm text-muted">
        {mode === "login" ? (
          <>
            No account?{" "}
            <Link href="/account/register" className="font-semibold text-orange">
              Create one
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/account/login" className="font-semibold text-orange">
              Sign in
            </Link>
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
