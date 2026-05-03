"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const HERO_ICONS = [
  { src: "/icons/pizza.png",        alt: "Pizza",        fallback: "🍕" },
  { src: "/icons/hamburguesa.png",  alt: "Hamburguesa",  fallback: "🍔" },
  { src: "/icons/helado.png",       alt: "Helado",       fallback: "🍦" },
  { src: "/icons/supermercado.png", alt: "Supermercado", fallback: "🛒" },
  { src: "/icons/farmacia.png",     alt: "Farmacia",     fallback: "💊" },
  { src: "/icons/mascotas.png",     alt: "Mascotas",     fallback: "🐕" },
] as const;

export function HeroBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % HERO_ICONS.length);
        setImgError(false);
        setIsVisible(true);
      }, 400);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const currentIcon = HERO_ICONS[currentIndex] || HERO_ICONS[0];

  return (
    <section className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 sm:gap-5 px-4 sm:px-6 py-4 sm:py-6">

        {/* Icono animado */}
        <div className="flex-shrink-0 w-24 h-24 sm:w-36 sm:h-36 rounded-full bg-orange-50 flex items-center justify-center">
          <div
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "scale(1) rotate(0deg)" : "scale(0.6) rotate(-10deg)",
              transition: "opacity 0.35s ease, transform 0.35s ease",
            }}
          >
            {imgError ? (
              <span className="text-3xl sm:text-5xl leading-none select-none">
                {currentIcon.fallback}
              </span>
            ) : (
              <Image
                src={currentIcon.src}
                alt={currentIcon.alt}
                width={64}
                height={64}
                className="object-contain w-14 h-14 sm:w-24 sm:h-24"
                onError={() => setImgError(true)}
              />
            )}
          </div>
        </div>

        {/* Eslogan */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-3xl font-extrabold text-orange-600 leading-tight mb-1">
            Vadelivery
          </h1>
          <p className="text-xs sm:text-base text-neutral-700 leading-snug font-medium">
            Pedí lo que quieras, llega rápido a tu puerta
          </p>
        </div>
      </div>
    </section>
  );
}