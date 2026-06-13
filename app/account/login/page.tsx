import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCustomer } from "@/lib/data/customer";

export default async function LoginPage() {
  if (await getCustomer()) redirect("/account");

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <Link href="/" className="eyebrow text-muted hover:text-orange">
        ← Back to shop
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-ink-soft">Sign in to your Muru account.</p>
      <div className="mt-8 rounded-xl border border-line bg-white p-6">
        <AuthForm mode="login" />
      </div>
    </div>
  );
}
