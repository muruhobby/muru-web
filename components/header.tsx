import Form from "next/form";
import { listCollections } from "@/lib/data/collections";
import { LocalizedLink } from "@/components/localized-link";
import { HeaderSession } from "@/components/header-session";
import { localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

// Only cached catalog data here — cart/customer render client-side in
// HeaderSession, keeping every page around this header statically renderable.
export async function Header({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const collections = await listCollections();

  const nav = collections.slice(0, 5);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-5 py-4">
        <LocalizedLink href="/" className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold tracking-tight text-orange">
            MURU
          </span>
        </LocalizedLink>

        <nav className="ml-4 hidden items-center gap-6 lg:flex">
          {nav.map((c) => (
            <LocalizedLink
              key={c.id}
              href={`/collection/${c.handle}`}
              className="text-sm font-semibold text-ink-soft transition-colors hover:text-orange"
            >
              {c.title}
            </LocalizedLink>
          ))}
        </nav>

        <Form
          action={localePath(lang, "/search")}
          className="relative ml-auto hidden w-full max-w-xs sm:block"
        >
          <input
            type="search"
            name="q"
            placeholder={dict.nav.searchPlaceholder}
            aria-label={dict.nav.searchAria}
            className="w-full rounded-md border border-line bg-paper py-2 pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
          />
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          >
            <circle cx="9" cy="9" r="6" />
            <path d="m18 18-4.5-4.5" strokeLinecap="round" />
          </svg>
        </Form>

        <HeaderSession />
      </div>
    </header>
  );
}
