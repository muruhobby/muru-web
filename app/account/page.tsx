import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomer, logout } from "@/lib/data/customer";

export default async function AccountPage() {
  const customer = await getCustomer();
  if (!customer) redirect("/account/login");

  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <p className="eyebrow text-orange">My account</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
        Hi, {customer.first_name || customer.email}
      </h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Info label="Email" value={customer.email} />
        <Info
          label="Name"
          value={
            [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
            "—"
          }
        />
      </div>

      <div className="mt-8 flex gap-3">
        <Link
          href="/shop"
          className="rounded-md bg-ink px-5 py-3 text-sm font-bold text-white hover:bg-orange"
        >
          Continue shopping
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-md border border-line px-5 py-3 text-sm font-bold text-ink-soft hover:border-ink"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <p className="eyebrow text-muted">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
