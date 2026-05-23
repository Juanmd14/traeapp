"use client";

import Image from "next/image";
import { useState } from "react";
import { Plus, Check } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/stores/cart";
import { formatPrice, cn } from "@/lib/utils";

type Props = {
  product: {
    id: string;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    price: number;
    compareAtPrice?: number | null;
    isAvailable: boolean;
  };
  storeId: string;
  storeName: string;
  storeSlug: string;
  deliveryFee: number;
  minOrderAmount: number;
};

export function SearchProductCard({
  product,
  storeId,
  storeName,
  storeSlug,
  deliveryFee,
  minOrderAmount,
}: Props) {
  const [justAdded, setJustAdded] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const add = useCart((s) => s.add);
  const replaceWithStore = useCart((s) => s.replaceWithStore);
  const currentStoreName = useCart((s) => s.storeName);

  const hasDiscount =
    product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round(
        ((product.compareAtPrice! - product.price) / product.compareAtPrice!) *
          100
      )
    : 0;

  const doAdd = () => {
    const result = add({
      storeId,
      storeName,
      storeSlug,
      deliveryFee,
      minOrderAmount,
      item: {
        productId: product.id,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        unitPrice: Number(product.price),
        quantity: 1,
        modifiers: [],
      },
    });
    if (result === "different-store") {
      setShowSwitchModal(true);
      return;
    }
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleSwitch = () => {
    replaceWithStore({
      storeId,
      storeName,
      storeSlug,
      deliveryFee,
      minOrderAmount,
      item: {
        productId: product.id,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        unitPrice: Number(product.price),
        quantity: 1,
      },
    });
    setShowSwitchModal(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <>
      <div
        className={cn(
          "bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden flex flex-col",
          "shadow-[0_2px_12px_rgba(230,56,35,0.10)]",
          "hover:shadow-[0_6px_22px_rgba(230,56,35,0.22)]",
          "hover:scale-[1.015]",
          "active:scale-[0.985]",
          "transition-all duration-200",
          !product.isAvailable && "opacity-60"
        )}
      >
        {/* Imagen superior */}
        <div className="relative w-full aspect-square overflow-hidden">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 dark:from-neutral-800 to-neutral-200 dark:to-neutral-700 flex items-center justify-center">
              <span className="text-5xl opacity-25 select-none">🍽️</span>
            </div>
          )}

          {hasDiscount && (
            <div className="absolute top-2 left-2 bg-warning-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              -{discountPct}%
            </div>
          )}

          {!product.isAvailable && (
            <div className="absolute inset-0 bg-white/65 dark:bg-neutral-900/65 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 bg-white/80 dark:bg-neutral-900/80 px-2 py-1 rounded-full">
                No disponible
              </span>
            </div>
          )}
        </div>

        {/* Info inferior */}
        <div className="flex flex-col flex-1 px-3 pt-2.5 pb-3 gap-1">
          <Link
            href={`/s/${storeSlug}`}
            className="text-[10px] text-primary-600 font-semibold truncate hover:underline leading-tight"
          >
            {storeName}
          </Link>

          <h3 className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-snug flex-1">
            {product.name}
          </h3>

          {/* Precio + botón */}
          <div className="flex items-end justify-between gap-2 mt-2">
            <div className="flex flex-col leading-tight">
              <span className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">
                {formatPrice(product.price)}
              </span>
              {hasDiscount && (
                <span className="text-[11px] text-neutral-400 line-through">
                  {formatPrice(product.compareAtPrice!)}
                </span>
              )}
            </div>

            <button
              onClick={doAdd}
              disabled={!product.isAvailable}
              aria-label="Agregar al carrito"
              className={cn(
                "size-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-150 active:scale-90",
                justAdded
                  ? "bg-accent-500 text-white"
                  : "bg-primary-600 text-white hover:bg-primary-700 shadow-[0_2px_8px_rgba(230,56,35,0.35)]"
              )}
            >
              {justAdded ? (
                <Check className="size-4" strokeWidth={3} />
              ) : (
                <Plus className="size-4" strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal cambio de comercio */}
      {showSwitchModal && (
        <div
          className="fixed inset-0 z-50 bg-neutral-900/60 flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowSwitchModal(false)}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-t-xl sm:rounded-xl w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-heading-md font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              ¿Empezar un carrito nuevo?
            </h3>
            <p className="text-body-md text-neutral-600 dark:text-neutral-400 mb-5">
              Tu carrito tiene productos de <strong>{currentStoreName}</strong>.
              Si seguís, vamos a vaciarlo y agregar este producto de{" "}
              <strong>{storeName}</strong>.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSwitchModal(false)}
                className="flex-1 h-11 rounded-md border border-neutral-200 dark:border-neutral-700 text-body-md font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSwitch}
                className="flex-1 h-11 rounded-md bg-primary-600 hover:bg-primary-700 text-white text-body-md font-medium transition"
              >
                Vaciar y agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
