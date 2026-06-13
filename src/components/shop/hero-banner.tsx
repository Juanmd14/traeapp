"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const HERO_ICONS = [
  { src: "/icons/pizza-blanco2.png",        alt: "Pizza",        fallback: "🍕" },
  { src: "/icons/hamburguesa-blanco2.png",  alt: "Hamburguesa",  fallback: "🍔" },
  { src: "/icons/helado-blanco2.png",       alt: "Helado",       fallback: "🍦" },
  { src: "/icons/supermercado-blanco2.png", alt: "Supermercado", fallback: "🛒" },
  { src: "/icons/farmacia-blanco2.png",     alt: "Farmacia",     fallback: "💊" },
  { src: "/icons/mascotas-blanco2.png",     alt: "Mascotas",     fallback: "🐕" },
  { src: "/icons/bebidas-blanco2.png",      alt: "Bebidas",      fallback: "🍺" },
] as const;

export function HeroBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allLoaded, setAllLoaded] = useState(false);

  useEffect(() => {
    let loaded = 0;
    const total = HERO_ICONS.length;
    HERO_ICONS.forEach((icon) => {
      const img = new window.Image();
      img.src = icon.src;
      img.onload = () => { loaded++; if (loaded === total) setAllLoaded(true); };
      img.onerror = () => { loaded++; if (loaded === total) setAllLoaded(true); };
    });
  }, []);

  useEffect(() => {
    if (!allLoaded) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_ICONS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [allLoaded]);

  return (
    <section
      className="
        relative rounded-3xl overflow-hidden
        bg-gradient-to-br from-primary-50 via-white to-primary-50/40
        dark:from-primary-950/20 dark:via-neutral-900 dark:to-neutral-950
        border border-primary-100/60 dark:border-neutral-800
        shadow-primary-sm
      "
    >
      {/* Blob de luz difuminado arriba a la izquierda — profundidad */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -left-10 w-48 h-48 rounded-full bg-primary-200/40 dark:bg-primary-500/10 blur-3xl"
      />

      {/* Isotipo decorativo en la esquina inferior derecha */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-6 -right-6 opacity-[0.07] dark:opacity-[0.10]"
      >
        <Image
          src="/brand/icon-trae.svg"
          alt=""
          width={180}
          height={190}
          priority
          className="w-32 h-32 sm:w-44 sm:h-44"
        />
      </div>

      <div className="relative flex items-center gap-4 sm:gap-6 px-4 sm:px-6 py-5 sm:py-7">
        {/* Círculo con íconos rotatorios */}
        <div
          className="
            flex-shrink-0 w-20 h-20 sm:w-28 sm:h-28 rounded-full
            bg-white dark:bg-neutral-100
            flex items-center justify-center
            ring-1 ring-primary-100 dark:ring-primary-900/40
            border-2 border-white dark:border-neutral-100
            shadow-[0_6px_24px_rgba(255,77,41,0.22)]
            overflow-hidden
          "
        >
          {/* Double-buffer: todas las imágenes apiladas, solo cambia opacity */}
          <div className="relative w-14 h-14 sm:w-20 sm:h-20">
            {HERO_ICONS.map((icon, i) => (
              <Image
                key={icon.src}
                src={icon.src}
                alt={icon.alt}
                width={96}
                height={96}
                priority={i === 0}
                className="absolute inset-0 w-full h-full object-contain transition-all duration-500 ease-out"
                style={{
                  opacity: allLoaded && i === currentIndex ? 1 : 0,
                  transform: allLoaded && i === currentIndex ? "scale(1)" : "scale(0.85)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Wordmark + eslogan */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 sm:gap-2.5 mb-1 sm:mb-1.5">
            <span className="font-display font-black text-3xl sm:text-5xl text-neutral-900 dark:text-white tracking-tight leading-none uppercase">
              Trae
            </span>
            <span className="font-display font-black text-3xl sm:text-5xl text-primary-600 dark:text-primary-400 tracking-tight leading-none uppercase">
              App
            </span>
          </div>
          <p className="text-xs sm:text-base font-display font-semibold text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Pedí lo que quieras, llega rápido a tu puerta
          </p>
        </div>
      </div>

    </section>
  );
}
