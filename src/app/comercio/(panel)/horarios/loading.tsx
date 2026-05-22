import { Skeleton } from "@/components/ui/skeleton";
import { StaggeredFadeIn } from "@/components/ui/animated-loader";

export default function HorariosLoading() {
  return (
    <div className="max-w-2xl">
      <StaggeredFadeIn delay={0}>
        <div className="mb-8">
          <Skeleton variant="text" className="w-48 h-8 mb-2" />
          <Skeleton variant="text" className="w-72 h-4" />
        </div>
      </StaggeredFadeIn>

      <StaggeredFadeIn delay={100}>
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800">
          {Array.from({ length: 7 }).map((_, i) => (
            <StaggeredFadeIn key={i} delay={150 + i * 50}>
              <div className="p-4 flex items-center gap-4">
                <div className="w-28">
                  <Skeleton variant="text" className="w-20 h-5" />
                </div>
                <Skeleton variant="rectangular" className="h-6 w-11 rounded" />
                <div className="flex items-center gap-2 flex-1">
                  <Skeleton variant="rectangular" className="h-9 w-28 rounded-md" />
                  <Skeleton variant="text" className="w-8 h-4" />
                  <Skeleton variant="rectangular" className="h-9 w-28 rounded-md" />
                </div>
              </div>
            </StaggeredFadeIn>
          ))}
        </div>
      </StaggeredFadeIn>

      <StaggeredFadeIn delay={500}>
        <div className="mt-6">
          <Skeleton variant="rectangular" className="h-10 w-36 rounded-md" />
        </div>
      </StaggeredFadeIn>
    </div>
  );
}