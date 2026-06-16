import Link from "next/link";
import { listCollections } from "@/lib/data/collections";

export async function Footer() {
  const collections = await listCollections();

  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-7xl px-5 py-10">
        <p className="eyebrow text-muted">Browse collections</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {collections.length === 0 && (
            <span className="text-sm text-muted">
              No collections yet — add them in Medusa admin.
            </span>
          )}
          {collections.map((c) => (
            <Link
              key={c.id}
              href={`/collection/${c.handle}`}
              className="rounded-md border border-line px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-ink hover:text-orange"
            >
              {c.title}
            </Link>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 sm:flex-row sm:items-center">
          <span className="text-xl font-extrabold tracking-tight text-orange">
            MURU
          </span>
          <nav className="flex flex-wrap gap-5 text-sm font-semibold text-ink-soft">
            <Link href="/faq" className="hover:text-orange">
              FAQ
            </Link>
            <Link href="/shipping" className="hover:text-orange">
              Shipping
            </Link>
            <Link href="/returns" className="hover:text-orange">
              Returns
            </Link>
            <Link href="/contact" className="hover:text-orange">
              Contact
            </Link>
          </nav>
          <span className="text-sm text-muted">© 2026 Muru</span>
        </div>
      </div>
    </footer>
  );
}
