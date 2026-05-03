import { Skeleton } from "@/components/ui/skeleton";
import { StaggeredFadeIn } from "@/components/ui/animated-loader";

export default function ProductosLoading() {
  return (
    <div className="max-w-5xl">
      <StaggeredFadeIn delay={0}>
        <div className="mb-6 flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton variant="text" className="w-32 h-7" />
            <Skeleton variant="text" className="w-56 h-4" />
          </div>
          <Skeleton variant="rectangular" className="h-10 w-36 rounded-md" />
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

      <StaggeredFadeIn delay={150}>
        <div className="bg-white rounded-lg border border-neutral-200">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-neutral-100 text-body-xs text-neutral-500">
            <div className="col-span-5">Producto</div>
            <div className="col-span-2">Precio</div>
            <div className="col-span-2">Estado</div>
            <div className="col-span-3 text-right">Acciones</div>
          </div>
          
          {Array.from({ length: 8 }).map((_, i) => (
            <StaggeredFadeIn key={i} delay={200 + i * 30}>
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-neutral-50 items-center">
                <div className="col-span-5 flex items-center gap-3">
                  <Skeleton variant="rectangular" className="h-12 w-12 rounded-md" />
                  <div className="space-y-1">
                    <Skeleton variant="text" className="w-32 h-4" />
                    <Skeleton variant="text" className="w-48 h-3" />
                  </div>
                </div>
                <div className="col-span-2">
                  <Skeleton variant="text" className="w-16 h-5" />
                </div>
                <div className="col-span-2">
                  <Skeleton variant="rectangular" className="h-6 w-16 rounded-full" />
                </div>
                <div className="col-span-3 flex justify-end gap-2">
                  <Skeleton variant="rectangular" className="h-8 w-8 rounded-md" />
                  <Skeleton variant="rectangular" className="h-8 w-8 rounded-md" />
                </div>
              </div>
            </StaggeredFadeIn>
          ))}
        </div>
      </StaggeredFadeIn>
    </div>
  );
}