import { Skeleton } from "@/components/ui/skeleton";
import { StaggeredFadeIn } from "@/components/ui/animated-loader";

export default function PedidosLoading() {
  return (
    <div className="max-w-7xl mx-auto">
      <StaggeredFadeIn delay={0}>
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton variant="text" className="w-40 h-8" />
            <Skeleton variant="text" className="w-64 h-4" />
          </div>
          <Skeleton variant="rectangular" className="h-10 w-24 rounded-full" />
        </div>
      </StaggeredFadeIn>

      <StaggeredFadeIn delay={100}>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md p-3 sm:p-4"
            >
              <Skeleton variant="text" className="w-16 h-4" />
              <Skeleton variant="text" className="w-12 h-8 mt-2" />
              <Skeleton variant="text" className="w-14 h-3 mt-1" />
            </div>
          ))}
        </div>
      </StaggeredFadeIn>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <StaggeredFadeIn key={i} delay={150 + i * 50}>
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-1.5">
                  <Skeleton variant="text" className="w-20 h-5" />
                  <Skeleton variant="text" className="w-24 h-3" />
                </div>
                <Skeleton variant="rectangular" className="h-6 w-16 rounded-full" />
              </div>

              <div className="space-y-2 border-t border-neutral-100 dark:border-neutral-800 pt-3">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <Skeleton variant="text" className="w-24 h-4" />
                    <Skeleton variant="text" className="w-12 h-4" />
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                <Skeleton variant="rectangular" className="h-9 flex-1 rounded-md" />
                <Skeleton variant="rectangular" className="h-9 flex-1 rounded-md" />
              </div>
            </div>
          </StaggeredFadeIn>
        ))}
      </div>
    </div>
  );
}