export default function HomeLoading() {
  return (
    <div className="container-shop py-4 space-y-6">
      <div className="h-40 sm:h-48 bg-neutral-200 rounded-xl animate-pulse" />

      <section>
        <div className="h-6 w-32 bg-neutral-200 rounded mb-3 animate-pulse" />
        <div className="flex gap-2.5 overflow-hidden pb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="w-20 h-10 bg-neutral-200 rounded-full shrink-0 animate-pulse"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
      </section>

      <section>
        <div className="h-6 w-48 bg-neutral-200 rounded mb-3 animate-pulse" />
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-neutral-200 rounded-xl animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}