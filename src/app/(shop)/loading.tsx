import { Skeleton, SkeletonCategoryPill, SkeletonStoreCard } from "@/components/ui/skeleton";
import { StaggeredFadeIn } from "@/components/ui/animated-loader";

export default function HomeLoading() {
  return (
    <div className="container-shop py-4 space-y-6">
      <StaggeredFadeIn delay={0}>
        <div className="h-40 sm:h-48 rounded-xl overflow-hidden">
          <Skeleton variant="rectangular" className="h-full w-full" />
        </div>
      </StaggeredFadeIn>

      <StaggeredFadeIn delay={100}>
        <section>
          <Skeleton variant="text" className="w-32 h-6 mb-3" />
          <div className="flex gap-2.5 overflow-hidden pb-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="animate-fade-in-up opacity-0" style={{ animationDelay: `${150 + i * 50}ms` }}>
                <SkeletonCategoryPill />
              </div>
            ))}
          </div>
        </section>
      </StaggeredFadeIn>

      <StaggeredFadeIn delay={200}>
        <section>
          <Skeleton variant="text" className="w-48 h-6 mb-3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-fade-in-up opacity-0" style={{ animationDelay: `${250 + i * 80}ms` }}>
                <SkeletonStoreCard />
              </div>
            ))}
          </div>
        </section>
      </StaggeredFadeIn>

      <StaggeredFadeIn delay={400}>
        <section>
          <Skeleton variant="text" className="w-40 h-6 mb-3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-fade-in-up opacity-0" style={{ animationDelay: `${450 + i * 80}ms` }}>
                <SkeletonStoreCard />
              </div>
            ))}
          </div>
        </section>
      </StaggeredFadeIn>
    </div>
  );
}