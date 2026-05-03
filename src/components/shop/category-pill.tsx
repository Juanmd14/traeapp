"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type Category = {
  slug: string;
  name: string;
  emoji: string;
  bgClass: string;
};

// Mapeo de slug → nombre de archivo real en public/icons/
const SLUG_TO_FILE: Record<string, string> = {
  comida:       "pizza",
  supermercado: "supermercado",
  farmacia:     "farmacia",
  bebidas:      "hamburguesa", // no tenés bebidas.png, usá emoji fallback
  heladeria:    "helado",
  mascotas:     "mascotas",
};

export function CategoryPill({ category }: { category: Category }) {
  const [imgError, setImgError] = useState(false);

  const filename = SLUG_TO_FILE[category.slug];
  const iconSrc = filename ? `/icons/${filename}.png` : null;

  return (
    <Link
      href={`/c/${category.slug}`}
      className="flex flex-col items-center gap-1.5 min-w-[64px] sm:min-w-[72px]"
    >
      <div
        className={cn(
          "size-12 sm:size-14 rounded-full flex items-center justify-center transition",
          "hover:scale-105 active:scale-95",
          category.bgClass,
        )}
      >
        {!iconSrc || imgError ? (
          <span className="text-xl sm:text-2xl">{category.emoji}</span>
        ) : (
          <Image
            src={iconSrc}
            alt={category.name}
            width={40}
            height={40}
            className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <span className="text-[10px] sm:text-body-xs font-medium text-neutral-700 text-center leading-tight">
        {category.name}
      </span>
    </Link>
  );
}