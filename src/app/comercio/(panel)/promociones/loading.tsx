import { Skeleton } from "@/components/ui/skeleton";
import { StaggeredFadeIn } from "@/components/ui/animated-loader";

export default function PromocionesLoading() {
  return (
    <div className="max-w-2xl">
      <StaggeredFadeIn delay={0}>
        <div className="mb-8 flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton variant="text" className="w-40 h-8 mb-2" />
            <Skeleton variant="text" className="w-64 h-4" />
          </div>
          <Skeleton variant="rectangular" className="h-10 w-36 rounded-md" />
        </div>
      </StaggeredFadeIn>

      <StaggeredFadeIn delay={100}>
        <div className="bg-neutral-50 rounded-lg p-6 border border-neutral-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonInput />
            <div className="space-y-1.5">
              <Skeleton variant="text" className="w-20 h-4" />
              <Skeleton variant="rectangular" className="h-10 w-full rounded-md" />
            </div>
            <SkeletonInput />
            <SkeletonInput />
          </div>
          <Skeleton variant="rectangular" className="h-10 w-36 rounded-md" />
        </div>
      </StaggeredFadeIn>

      <StaggeredFadeIn delay={200}>
        <div className="mt-8 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <StaggeredFadeIn key={i} delay={250 + i * 50}>
              <div className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 bg-white">
                <div className="flex items-center gap-4">
                  <Skeleton variant="circular" className="h-10 w-10" />
                  <div>
                    <Skeleton variant="text" className="w-24 h-5" />
                    <Skeleton variant="text" className="w-32 h-3 mt-1" />
                  </div>
                </div>
                <Skeleton variant="text" className="w-16 h-5" />
              </div>
            </StaggeredFadeIn>
          ))}
        </div>
      </StaggeredFadeIn>
    </div>
  );
}

function SkeletonInput() {
  return (
    <div className="space-y-1.5">
      <Skeleton variant="text" className="w-24 h-4" />
      <Skeleton variant="rectangular" className="h-10 w-full" />
    </div>
  );
}