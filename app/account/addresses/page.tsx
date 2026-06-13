import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/data/customer";
import { getAddresses } from "@/lib/data/addresses";
import { AddressBook } from "@/components/address-book";

export default async function AddressesPage() {
  const customer = await getCustomer();
  if (!customer) redirect("/account/login");
  const addresses = await getAddresses();

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/account" className="eyebrow text-muted hover:text-orange">
        ← Account
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
        Address book
      </h1>
      <p className="mt-2 text-ink-soft">
        Saved addresses can be selected at checkout to calculate shipping.
      </p>

      <div className="mt-8">
        <AddressBook addresses={addresses} />
      </div>
    </div>
  );
}
