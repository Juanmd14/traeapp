export default function PedidosLoading() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-neutral-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-neutral-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-24 bg-neutral-200 rounded-full animate-pulse" />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-neutral-200 rounded-md p-3 sm:p-4"
          >
            <div className="h-4 w-16 bg-neutral-200 rounded animate-pulse" />
            <div className="h-8 w-12 bg-neutral-200 rounded mt-2 animate-pulse" />
            <div className="h-3 w-14 bg-neutral-200 rounded mt-1 animate-pulse" />
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-neutral-200 rounded-lg p-4 animate-pulse"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="space-y-1.5">
                <div className="h-5 w-20 bg-neutral-200 rounded" />
                <div className="h-3 w-24 bg-neutral-200 rounded" />
              </div>
              <div className="h-6 w-16 bg-neutral-200 rounded-full" />
            </div>

            <div className="space-y-2 border-t border-neutral-100 pt-3">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="flex justify-between">
                  <div className="h-4 w-24 bg-neutral-100 rounded" />
                  <div className="h-4 w-12 bg-neutral-100 rounded" />
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <div className="h-9 flex-1 bg-neutral-200 rounded-md" />
              <div className="h-9 flex-1 bg-neutral-200 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}