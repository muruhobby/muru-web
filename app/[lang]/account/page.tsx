import { AccountView } from "@/components/account-view";

export const metadata = { robots: { index: false } };

// Account data is session data — rendered client-side from the StoreProvider
// so this route stays static and navigations to it are instant.
export default function AccountPage() {
  return <AccountView />;
}
