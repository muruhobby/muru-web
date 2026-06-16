export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-white">
      <div className="h-40 w-full bg-paper" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-3 w-20 rounded bg-line" />
        <div className="h-4 w-3/4 rounded bg-line" />
        <div className="mt-2 h-5 w-1/3 rounded bg-line" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PillRowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-9 w-24 rounded-full bg-line" />
      ))}
    </div>
  );
}
