"use client";

import Image from "next/image";
import { useState } from "react";
import { Plus, Check, ChevronDown } from "lucide-react";
import { useCart } from "@/stores/cart";
import { formatPrice, cn } from "@/lib/utils";
import { ProductModifierModal } from "./product-modifier-modal";
import type { ModifierGroup } from "./product-modifier-modal";

export type ProductCardData = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  compareAtPrice?: number | null;
  isAvailable: boolean;
};

type Props = {
  product: ProductCardData;
  modifiers?: ModifierGroup[];
  storeId: string;
  storeName: string;
  storeSlug: string;
  deliveryFee: number;
  minOrderAmount: number;
};

export function ProductCard({
  product,
  modifiers = [],
  storeId,
  storeName,
  storeSlug,
  deliveryFee,
  minOrderAmount,
}: Props) {
  const [justAdded, setJustAdded] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showModifierModal, setShowModifierModal] = useState(false);
  const add = useCart((s) => s.add);
  const replaceWithStore = useCart((s) => s.replaceWithStore);
  const currentStoreId = useCart((s) => s.storeId);
  const currentStoreName = useCart((s) => s.storeName);

  const hasModifiers = modifiers.length > 0;

  const doAdd = (selectedModifiers: Array<{ optionId: string; name: string; priceDelta: number }>, quantity: number) => {
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
        quantity,
        modifiers: selectedModifiers,
      },
    });
    if (result === "different-store") { setShowSwitchModal(true); return; }
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleAdd = () => {
    if (hasModifiers) { setShowModifierModal(true); return; }
    doAdd([], 1);
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

  const hasDiscount =
    product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round(
        ((product.compareAtPrice! - product.price) / product.compareAtPrice!) *
          100
      )
    : 0;

  return (
    <>
      <div
        className={cn(
          "bg-white dark:bg-neutral-900 rounded-2xl flex items-stretch relative overflow-hidden",
          "shadow-[0_1px_3px_rgba(28,25,23,0.07),0_4px_14px_rgba(28,25,23,0.05)]",
          "hover:shadow-[0_4px_16px_rgba(28,25,23,0.1),0_8px_24px_rgba(28,25,23,0.06)]",
          "transition-shadow duration-200",
          !product.isAvailable && "opacity-55"
        )}
      >
        {/* Info — izquierda */}
        <div className="flex-1 min-w-0 px-4 py-3.5 flex flex-col min-h-[100px]">
          <h3 className="font-semibold text-neutral-900 text-[15px] leading-snug line-clamp-2">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-[12.5px] text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Precio + botón */}
          <div className="flex items-center justify-between mt-auto pt-2.5 gap-3">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-[17px] font-bold text-neutral-900 tracking-tight">
                {formatPrice(product.price)}
              </span>
              {hasDiscount && (
                <span className="text-[12px] text-neutral-400 line-through">
                  {formatPrice(product.compareAtPrice!)}
                </span>
              )}
            </div>

            <button
              onClick={handleAdd}
              disabled={!product.isAvailable}
              className={cn(
                "flex items-center justify-center flex-shrink-0 transition-all duration-150 active:scale-90",
                hasModifiers
                  ? "h-8 px-3 rounded-full gap-1 text-[12px] font-semibold"
                  : "size-8 rounded-full",
                justAdded
                  ? "bg-accent-500 text-white shadow-none"
                  : "bg-primary-600 text-white hover:bg-primary-700 shadow-[0_2px_8px_rgba(230,56,35,0.35)]"
              )}
              aria-label="Agregar al carrito"
            >
              {justAdded ? (
                <Check className="size-4" strokeWidth={3} />
              ) : hasModifiers ? (
                <>
                  <Plus className="size-3.5" strokeWidth={2.5} />
                  <span>Elegir</span>
                </>
              ) : (
                <Plus className="size-4" strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>

        {/* Imagen — derecha, flush */}
        <div className="relative w-[100px] sm:w-[120px] flex-shrink-0 self-stretch">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100px, 120px"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 dark:from-neutral-800 to-neutral-200 dark:to-neutral-700 flex items-center justify-center">
              <span className="text-3xl opacity-30">🍽️</span>
            </div>
          )}

          {hasDiscount && (
            <div className="absolute top-2 left-0 bg-warning-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-r-md">
              -{discountPct}%
            </div>
          )}

          {!product.isAvailable && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
              <span className="text-[11px] font-semibold text-neutral-600 text-center px-1">
                No disponible
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Modal de modificadores */}
      {showModifierModal && (
        <ProductModifierModal
          product={{ id: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl }}
          modifiers={modifiers}
          onConfirm={(selectedModifiers, quantity) => {
            setShowModifierModal(false);
            doAdd(selectedModifiers, quantity);
          }}
          onClose={() => setShowModifierModal(false)}
        />
      )}

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
            <h3 className="text-heading-md font-semibold text-neutral-900 mb-2">
              ¿Empezar un carrito nuevo?
            </h3>
            <p className="text-body-md text-neutral-600 mb-5">
              Tu carrito tiene productos de{" "}
              <strong>{currentStoreName}</strong>. Si seguís, vamos a vaciarlo
              y agregar este producto de <strong>{storeName}</strong>.
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