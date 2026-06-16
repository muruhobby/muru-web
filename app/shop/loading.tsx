import { PillRowSkeleton, ProductGridSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-5 py-12">
      <div className="h-3 w-24 rounded bg-line" />
      <div className="mt-2 h-9 w-40 rounded bg-line" />

      <div className="mt-6">
        <PillRowSkeleton />
      </div>

      <div className="mt-8">
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
