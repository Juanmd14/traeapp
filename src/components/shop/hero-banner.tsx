"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

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
    <section className="
      rounded-2xl overflow-hidden
      bg-white dark:bg-neutral-900
      border border-neutral-200 dark:border-neutral-800
      shadow-sm
    ">
      <div className="flex items-center gap-4 sm:gap-6 px-4 sm:px-6 py-4 sm:py-6">

        {/* Icono dentro de círculo blanco para que el PNG con fondo no choque */}
        <div className="flex-shrink-0 w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-white flex items-center justify-center shadow-sm border border-neutral-100">
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
                className="object-contain w-16 h-16 sm:w-24 sm:h-24"
                onError={() => setImgError(true)}
              />
            )}
          </div>
        </div>

        {/* Eslogan — coral en ambos modos */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-3xl font-extrabold text-primary-600 dark:text-primary-400 leading-tight mb-1">
            Vadelivery
          </h1>
          <p className="text-xs sm:text-base text-neutral-700 dark:text-neutral-300 leading-snug font-medium">
            Pedí lo que quieras, llega rápido a tu puerta
          </p>
        </div>
      </div>
    </section>
  );
}