"use client";

import Image from "next/image";
import { useState } from "react";

export function AnimatedLoader({ 
  onComplete,
  duration = 1000 
}: { 
  onComplete?: () => void;
  duration?: number;
}) {
  const [isVisible, setIsVisible] = useState(true);

  setTimeout(() => {
    setIsVisible(false);
    onComplete?.();
  }, duration);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <div className="relative">
        <Image
          src="/logo-vadelivery.jpg"
          alt="Vadelivery"
          width={180}
          height={60}
          className="h-16 w-auto animate-float"
          priority
        />
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
          <div className="h-1 w-24 rounded-full bg-primary/30 overflow-hidden">
            <div 
              className="h-full bg-primary animate-[shimmer_1s_ease-in-out_forwards]"
              style={{ 
                animationDuration: `${duration}ms`,
                width: '100%'
              }}
            />
          </div>
        </div>
      </div>
      <p className="mt-8 text-body-sm text-neutral-400 animate-pulse-soft">
        Cargando...
      </p>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="h-10 w-10 rounded-full border-2 border-neutral-200" />
          <div className="absolute inset-0 h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-body-sm text-neutral-400">Cargando...</p>
      </div>
    </div>
  );
}

export function StaggeredFadeIn({ 
  children, 
  delay = 0,
  className 
}: { 
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div 
      className={`animate-fade-in-up opacity-0 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function ShimmerPulse({ className }: { className?: string }) {
  return (
    <div 
      className={`relative overflow-hidden bg-neutral-200 rounded ${className}`}
    >
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.5s_infinite]"
      />
    </div>
  );
}