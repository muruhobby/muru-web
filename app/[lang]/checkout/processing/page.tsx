import type { Metadata } from "next";
import { LocalizedLink } from "@/components/localized-link";
import { VerifyPayment } from "@/components/verify-payment";
import { type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = { robots: { index: false } };

const FAILED = ["deny", "cancel", "expire", "failure"];

export default async function ProcessingPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: Locale }>;
  searchParams: Promise<{ transaction_status?: string }>;
}) {
  const { lang } = await params;
  const { transaction_status } = await searchParams;
  const dict = await getDictionary(lang);
  const failed = FAILED.includes(String(transaction_status ?? ""));

  if (failed) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20 text-center">
        <p className="text-6xl">⚠️</p>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight">
          {dict.processing.failedTitle}
        </h1>
        <p className="mt-2 text-muted">{dict.processing.failedBody}</p>
        <div className="mt-8 flex justify-center gap-3">
          <LocalizedLink
            href="/checkout"
            className="rounded-md border border-line px-5 py-3 text-sm font-bold hover:border-ink"
          >
            {dict.processing.backToCheckout}
          </LocalizedLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-20 text-center">
      <p className="text-6xl">⏳</p>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight">
        {dict.processing.pendingTitle}
      </h1>
      <p className="mt-2 text-muted">{dict.processing.pendingBody}</p>
      <VerifyPayment />
      <div className="mt-6">
        <LocalizedLink
          href="/account"
          className="text-sm font-semibold text-muted hover:text-orange"
        >
          {dict.processing.checkOrders}
        </LocalizedLink>
      </div>
    </div>
  );
}
