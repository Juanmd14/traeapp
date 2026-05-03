"use client";

import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";

type OptimizedImageProps = Omit<ImageProps, "src"> & {
  src?: string | null;
  fallback?: string;
};

const defaultFallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect fill='%23f5f5f4' width='400' height='400'/%3E%3Ctext fill='%23a8a29e' font-family='system-ui' font-size='64' x='50%25' y='50%25' text-anchor='middle' dy='.35em'%3E🛒%3C/text%3E%3C/svg%3E";

export function OptimizedImage({
  src,
  fallback = defaultFallback,
  className,
  alt,
  ...props
}: OptimizedImageProps) {
  if (!src) {
    return (
      <div className={cn("bg-neutral-100 flex items-center justify-center", className)}>
        <span className="text-4xl">🛒</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt || ""}
      className={cn("object-cover", className)}
      placeholder="blur"
      blurDataURL={getBase64Placeholder(src)}
      {...props}
    />
  );
}

function getBase64Placeholder(src: string): string {
  // Placeholder simple - en producción podría generarse dinámicamente
  return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='%23f5f5f4' width='100' height='100'/%3E%3C/svg%3E";
}

export function useImageLoader() {
  const preloadImage = (src: string) => {
    if (typeof window !== "undefined" && src) {
      const img = new Image();
      img.src = src;
    }
  };

  return { preloadImage };
}