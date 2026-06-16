import { ProductGridSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-5 py-12">
      <div className="h-3 w-24 rounded bg-line" />
      <div className="mt-2 h-9 w-72 rounded bg-line" />
      <div className="mt-2 h-4 w-32 rounded bg-line" />

      <div className="mt-8">
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
