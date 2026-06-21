import { listCollections } from "@/lib/data/collections";
import { LocalizedLink } from "@/components/localized-link";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export async function Footer({ dict }: { dict: Dictionary }) {
  const collections = await listCollections();

  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-7xl px-5 py-10">
        <p className="eyebrow text-muted">{dict.footer.browseCollections}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {collections.length === 0 && (
            <span className="text-sm text-muted">
              {dict.footer.noCollections}
            </span>
          )}
          {collections.map((c) => (
            <LocalizedLink
              key={c.id}
              href={`/collection/${c.handle}`}
              className="rounded-md border border-line px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-ink hover:text-orange"
            >
              {c.title}
            </LocalizedLink>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 sm:flex-row sm:items-center">
          <span className="text-xl font-extrabold tracking-tight text-orange">
            MURU
          </span>
          <nav className="flex flex-wrap gap-5 text-sm font-semibold text-ink-soft">
            <LocalizedLink href="/faq" className="hover:text-orange">
              {dict.footer.faq}
            </LocalizedLink>
            <LocalizedLink href="/shipping" className="hover:text-orange">
              {dict.footer.shipping}
            </LocalizedLink>
            <LocalizedLink href="/returns" className="hover:text-orange">
              {dict.footer.returns}
            </LocalizedLink>
            <LocalizedLink href="/contact" className="hover:text-orange">
              {dict.footer.contact}
            </LocalizedLink>
          </nav>
          <span className="text-sm text-muted">{dict.footer.copyright}</span>
        </div>
      </div>
    </footer>
  );
}
