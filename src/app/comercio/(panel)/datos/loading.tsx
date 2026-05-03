import { Skeleton, SkeletonInput, SkeletonCard } from "@/components/ui/skeleton";
import { StaggeredFadeIn } from "@/components/ui/animated-loader";

export default function DatosLoading() {
  return (
    <div className="max-w-3xl">
      <StaggeredFadeIn delay={0}>
        <div className="mb-8">
          <Skeleton variant="text" className="w-48 h-8 mb-2" />
          <Skeleton variant="text" className="w-80 h-4" />
        </div>
      </StaggeredFadeIn>

      <StaggeredFadeIn delay={100}>
        <div className="border-b border-neutral-200 pb-8 mb-8">
          <Skeleton variant="text" className="w-40 h-6 mb-1" />
          <Skeleton variant="text" className="w-64 h-4 mb-5" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonInput />
            <Skeleton variant="rectangular" className="aspect-video rounded-lg" />
            <Skeleton variant="rectangular" className="aspect-video rounded-lg md:col-span-2" />
          </div>
        </div>
      </StaggeredFadeIn>

      <StaggeredFadeIn delay={200}>
        <div className="border-b border-neutral-200 pb-8 mb-8">
          <Skeleton variant="text" className="w-48 h-6 mb-1" />
          <Skeleton variant="text" className="w-72 h-4 mb-5" />
          
          <div className="space-y-4 max-w-md">
            <SkeletonInput />
            <div className="space-y-1.5">
              <Skeleton variant="text" className="w-32 h-4" />
              <Skeleton variant="rectangular" className="h-10 w-full" />
            </div>
            <Skeleton variant="rectangular" className="h-10 w-32" />
          </div>
        </div>
      </StaggeredFadeIn>

      <StaggeredFadeIn delay={300}>
        <div>
          <Skeleton variant="text" className="w-40 h-6 mb-1" />
          <Skeleton variant="text" className="w-64 h-4 mb-5" />
          
          <div className="space-y-4 max-w-md">
            <SkeletonInput />
            <SkeletonInput />
          </div>
        </div>
      </StaggeredFadeIn>
    </div>
  );
}