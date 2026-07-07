import { AccountShell } from "@/components/account-shell";

export const metadata = { robots: { index: false } };

// Static shell around every signed-in account page; AccountShell renders the
// sidebar nav client-side and redirects to login when signed out.
export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AccountShell>{children}</AccountShell>;
}
