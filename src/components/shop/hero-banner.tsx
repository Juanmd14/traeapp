"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Logo } from "@/components/brand/logo";

const HERO_ICONS = [
  { src: "/icons/pizza-blanco.png",        alt: "Pizza",        fallback: "🍕" },
  { src: "/icons/hamburguesa-blanco.png",  alt: "Hamburguesa",  fallback: "🍔" },
  { src: "/icons/helado-blanco.png",       alt: "Helado",       fallback: "🍦" },
  { src: "/icons/supermercado-blanco.png", alt: "Supermercado", fallback: "🛒" },
  { src: "/icons/farmacia-blanco.png",     alt: "Farmacia",     fallback: "💊" },
  { src: "/icons/mascotas-blanco.png",     alt: "Mascotas",     fallback: "🐕" },
  { src: "/icons/bebidas-blanco.png",      alt: "Bebidas",      fallback: "🍺" },
] as const;

export function HeroBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [imgError, setImgError] = useState(false);
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
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % HERO_ICONS.length);
        setImgError(false);
        setIsVisible(true);
      }, 400);
    }, 2500);
    return () => clearInterval(interval);
  }, [allLoaded]);

  const currentIcon = HERO_ICONS[currentIndex] || HERO_ICONS[0];

  return (
    <section
      className="
        relative rounded-2xl overflow-hidden
        bg-gradient-to-br from-primary-50 via-white to-primary-50/40
        dark:from-primary-950/20 dark:via-neutral-900 dark:to-neutral-950
        border border-primary-100/60 dark:border-neutral-800
        shadow-sm
      "
    >
      {/* Isotipo decorativo en la esquina inferior derecha */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-6 -right-6 opacity-[0.07] dark:opacity-[0.10]"
      >
        <Image
          src="/brand/icon-vadelivery.svg"
          alt=""
          width={180}
          height={190}
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
            border-2 border-primary-100 dark:border-primary-900/40
            shadow-[0_4px_16px_rgba(255,77,41,0.15)]
          "
        >
          <div
            style={{
              opacity: allLoaded && isVisible ? 1 : 0,
              transform: allLoaded && isVisible
                ? "scale(1) rotate(0deg)"
                : "scale(0.5) rotate(-10deg)",
              transition: allLoaded
                ? "opacity 0.35s ease, transform 0.35s ease"
                : "none",
            }}
          >
            {imgError ? (
              <span className="text-4xl sm:text-6xl leading-none select-none">
                {currentIcon.fallback}
              </span>
            ) : (
              <Image
                src={currentIcon.src}
                alt={currentIcon.alt}
                width={96}
                height={96}
                priority
                className="object-contain w-16 h-16 sm:w-24 sm:h-24"
                onError={() => setImgError(true)}
              />
            )}
          </div>
        </div>

        {/* Wordmark + eslogan */}
        <div className="flex-1 min-w-0">
          <Logo className="h-7 sm:h-10 w-auto mb-1.5" priority />
          <p className="text-xs sm:text-base font-display font-semibold text-neutral-700 dark:text-neutral-300 leading-snug">
            Pedí lo que quieras, llega rápido a tu puerta
          </p>
        </div>
      </div>

      {/* Indicadores de posición — sutiles */}
      <div className="relative flex justify-center gap-1.5 pb-3">
        {HERO_ICONS.map((_, i) => (
          <span
            key={i}
            className={`block h-1 rounded-full transition-all duration-300 ${
              i === currentIndex
                ? "w-4 bg-primary-500"
                : "w-1 bg-neutral-300 dark:bg-neutral-700"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
