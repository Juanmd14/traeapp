export default function CartLoading() {
  return (
    <div className="container-shop py-4 pb-24 space-y-4">
      <div className="h-8 w-32 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="size-16 bg-neutral-200 dark:bg-neutral-700 rounded-md shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-32 bg-neutral-200 dark:bg-neutral-700 rounded" />
              <div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-700 rounded" />
            </div>
            <div className="h-6 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
        </div>
        <div className="flex justify-between">
          <div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
        </div>
        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3 flex justify-between">
          <div className="h-5 w-12 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div className="h-5 w-20 bg-neutral-200 dark:bg-neutral-700 rounded" />
        </div>
      </div>

      <div className="h-12 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse" />
    </div>
  );
}
