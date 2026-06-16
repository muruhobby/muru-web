import { ProductGridSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Hero */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-7xl gap-0 lg:grid-cols-2">
          <div className="flex flex-col justify-center gap-4 px-5 py-12 lg:py-20">
            <div className="h-3 w-48 rounded bg-line" />
            <div className="h-14 w-3/4 rounded bg-line" />
            <div className="h-4 w-full max-w-md rounded bg-line" />
            <div className="h-4 w-2/3 max-w-md rounded bg-line" />
            <div className="mt-4 flex gap-3">
              <div className="h-11 w-32 rounded-md bg-line" />
              <div className="h-11 w-36 rounded-md bg-line" />
            </div>
          </div>
          <div className="grid place-items-center border-l border-line px-5 py-12">
            <div className="h-64 w-64 rounded-2xl bg-paper" />
          </div>
        </div>
      </section>

      {/* New arrivals grid */}
      <section className="bg-paper">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <div className="h-3 w-28 rounded bg-line" />
          <div className="mt-2 h-9 w-48 rounded bg-line" />
          <div className="mt-8">
            <ProductGridSkeleton count={4} />
          </div>
        </div>
      </section>
    </div>
  );
}
