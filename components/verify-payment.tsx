"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkPaymentStatus } from "@/lib/client/checkout";
import { localePath } from "@/lib/i18n/config";
import { useDict, useLang } from "@/components/i18n-provider";

const POLL_MS = 4000;
const MAX_POLLS = 30; // ~2 minutes

export function VerifyPayment() {
  const dict = useDict();
  const lang = useLang();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [checkedPending, setCheckedPending] = useState(false);
  const inFlight = useRef(false);

  async function runCheck(manual: boolean) {
    if (inFlight.current) return false;
    inFlight.current = true;
    try {
      const res = await checkPaymentStatus();
      if (res.orderId) {
        router.replace(localePath(lang, `/order/${res.orderId}`));
        return true;
      }
      if (manual) setCheckedPending(true);
      return false;
    } finally {
      inFlight.current = false;
    }
  }

  // Auto-poll so QRIS / VA payments that settle in the background land the
  // customer on their order without them having to click.
  useEffect(() => {
    let count = 0;
    const id = setInterval(async () => {
      count += 1;
      if (count > MAX_POLLS) {
        clearInterval(id);
        return;
      }
      if (await runCheck(false)) clearInterval(id);
    }, POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mt-8">
      <button
        onClick={() =>
          startTransition(() => {
            void runCheck(true);
          })
        }
        disabled={pending}
        className="rounded-md bg-ink px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange disabled:opacity-60"
      >
        {pending ? dict.processing.checking : dict.processing.verifyButton}
      </button>
      {checkedPending && (
        <p className="mt-3 text-sm text-muted">{dict.processing.stillPending}</p>
      )}
    </div>
  );
}
