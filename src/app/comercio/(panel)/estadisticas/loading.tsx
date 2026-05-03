import { Skeleton } from "@/components/ui/skeleton";
import { StaggeredFadeIn } from "@/components/ui/animated-loader";

export default function EstadisticasLoading() {
  return (
    <div className="max-w-4xl">
      <StaggeredFadeIn delay={0}>
        <div className="mb-8">
          <Skeleton variant="text" className="w-40 h-8 mb-2" />
          <Skeleton variant="text" className="w-56 h-4" />
        </div>
      </StaggeredFadeIn>

      <StaggeredFadeIn delay={100}>
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg mb-6 w-fit">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" className="h-8 w-20 rounded-md" />
          ))}
        </div>
      </StaggeredFadeIn>

      <StaggeredFadeIn delay={150}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <StaggeredFadeIn key={i} delay={200 + i * 50}>
              <div className="bg-white rounded-lg border border-neutral-200 p-4">
                <div className="flex items-center gap-2 text-neutral-500 mb-1">
                  <Skeleton variant="circular" className="h-4 w-4" />
                  <Skeleton variant="text" className="w-12 h-3" />
                </div>
                <Skeleton variant="text" className="w-20 h-7" />
              </div>
            </StaggeredFadeIn>
          ))}
        </div>
      </StaggeredFadeIn>

      <StaggeredFadeIn delay={400}>
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <Skeleton variant="text" className="w-32 h-5 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton variant="text" className="w-24 h-4" />
                <Skeleton variant="text" className="w-16 h-4" />
              </div>
            ))}
          </div>
        </div>
      </StaggeredFadeIn>
    </div>
  );
}