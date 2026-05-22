import { Skeleton } from "@/components/ui/skeleton";
import { StaggeredFadeIn } from "@/components/ui/animated-loader";

export default function ProductosLoading() {
  return (
    <div className="max-w-5xl">
      <StaggeredFadeIn delay={0}>
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton variant="text" className="w-32 h-7" />
            <Skeleton variant="text" className="w-56 h-4" />
          </div>
          <Skeleton variant="rectangular" className="h-10 w-36 rounded-md shrink-0" />
        </div>
      </StaggeredFadeIn>

      <StaggeredFadeIn delay={100}>
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              className="h-9 w-24 rounded-full shrink-0"
            />
          ))}
        </div>
      </StaggeredFadeIn>

      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <StaggeredFadeIn key={i} delay={150 + i * 50}>
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <Skeleton variant="rectangular" className="size-16 sm:size-20 rounded-lg shrink-0" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <Skeleton variant="text" className="w-32 h-4" />
                <Skeleton variant="text" className="w-48 h-3" />
                <Skeleton variant="text" className="w-20 h-4" />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Skeleton variant="rectangular" className="h-6 w-11 rounded-full" />
                <Skeleton variant="rectangular" className="size-9 sm:size-8 rounded-md" />
                <Skeleton variant="rectangular" className="size-9 sm:size-8 rounded-md" />
              </div>
            </div>
          </StaggeredFadeIn>
        ))}
      </div>
    </div>
  );
}
