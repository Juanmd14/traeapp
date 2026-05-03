import { cn } from "@/lib/utils";

type SkeletonProps = {
  className?: string;
  variant?: "default" | "text" | "circular" | "rectangular" | "card";
};

export function Skeleton({ className, variant = "default" }: SkeletonProps) {
  const baseClasses = "relative overflow-hidden bg-neutral-200";

  const variantClasses = {
    default: "rounded-md",
    text: "rounded h-4",
    circular: "rounded-full",
    rectangular: "rounded-lg",
    card: "rounded-xl",
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        "before:absolute before:inset-0",
        "before:-translate-x-full before:animate-[shimmer_2s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent",
        className
      )}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl bg-white p-4 shadow-sm border border-neutral-100", className)}>
      <div className="flex gap-3">
        <Skeleton variant="rectangular" className="h-20 w-20 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-3/4 h-5" />
          <Skeleton variant="text" className="w-1/2 h-4" />
          <Skeleton variant="text" className="w-1/3 h-3" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonProductCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl bg-white border border-neutral-100 overflow-hidden", className)}>
      <Skeleton variant="rectangular" className="h-32 w-full" />
      <div className="p-3 space-y-2">
        <Skeleton variant="text" className="w-3/4 h-4" />
        <Skeleton variant="text" className="w-1/2 h-3" />
        <Skeleton variant="text" className="w-1/4 h-5 mt-2" />
      </div>
    </div>
  );
}

export function SkeletonCategoryPill({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-full bg-neutral-100", className)}>
      <Skeleton variant="circular" className="h-8 w-8" />
      <Skeleton variant="text" className="w-16 h-4" />
    </div>
  );
}

export function SkeletonStoreCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl bg-white border border-neutral-100 overflow-hidden", className)}>
      <Skeleton variant="rectangular" className="h-32 w-full" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" className="h-12 w-12" />
          <div className="flex-1 space-y-1">
            <Skeleton variant="text" className="w-2/3 h-4" />
            <Skeleton variant="text" className="w-1/2 h-3" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton variant="text" className="w-1/4 h-3" />
          <Skeleton variant="text" className="w-1/4 h-3" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonInput({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Skeleton variant="text" className="w-1/4 h-4" />
      <Skeleton variant="rectangular" className="h-10 w-full" />
    </div>
  );
}

export function SkeletonList({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="rectangular" className="h-16 w-full" />
      ))}
    </div>
  );
}