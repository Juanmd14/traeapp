export default function StoreLoading() {
  return (
    <div className="bg-neutral-50 min-h-screen pb-24">
      <div className="relative h-40 sm:h-56 bg-neutral-200 animate-pulse" />

      <div className="container-shop -mt-8 relative">
        <div className="bg-white rounded-xl shadow-card p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="size-14 rounded-md bg-neutral-200 animate-pulse shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-neutral-200 rounded animate-pulse" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <div className="h-6 w-16 bg-neutral-200 rounded-full animate-pulse" />
            <div className="h-6 w-20 bg-neutral-200 rounded-full animate-pulse" />
            <div className="h-6 w-24 bg-neutral-200 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      <div className="container-shop py-5 space-y-6">
        {Array.from({ length: 3 }).map((_, catIdx) => (
          <section key={catIdx}>
            <div className="h-6 w-40 bg-neutral-200 rounded mb-3 animate-pulse" />
            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, prodIdx) => (
                <div
                  key={prodIdx}
                  className="h-20 bg-neutral-100 rounded-lg animate-pulse"
                  style={{ animationDelay: `${(catIdx * 3 + prodIdx) * 50}ms` }}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}