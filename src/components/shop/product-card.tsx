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
          "bg-white border border-neutral-200 rounded-xl overflow-hidden flex gap-0 relative hover:shadow-md transition-shadow",
          !product.isAvailable && "opacity-50"
        )}
      >
        {/* Info — izquierda */}
        <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-body-md font-semibold text-neutral-900 line-clamp-2 leading-snug">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-body-sm text-neutral-400 line-clamp-2 mt-1 leading-snug">
                {product.description}
              </p>
            )}
          </div>

          {/* Precio + botón abajo */}
          <div className="flex items-end justify-between mt-3 gap-2">
            <div className="flex flex-col">
              {hasDiscount && (
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-body-xs text-neutral-400 line-through">
                    {formatPrice(product.compareAtPrice!)}
                  </span>
                  <span className="bg-warning-100 text-warning-800 text-body-xs font-semibold px-1.5 py-0.5 rounded-full">
                    {discountPct}% off
                  </span>
                </div>
              )}
              <span className="text-body-lg font-bold text-neutral-900">
                {formatPrice(product.price)}
              </span>
            </div>

            {/* Botón agregar */}
            <button
              onClick={handleAdd}
              disabled={!product.isAvailable}
              className={cn(
                "rounded-full flex items-center justify-center transition shadow-sm flex-shrink-0",
                hasModifiers ? "px-3 py-2 gap-1 text-body-xs font-medium" : "size-9",
                justAdded
                  ? "bg-accent-600 text-white"
                  : "bg-primary-600 text-white hover:bg-primary-700 active:scale-95"
              )}
              aria-label="Agregar al carrito"
            >
              {justAdded ? (
                <Check className="size-5" strokeWidth={3} />
              ) : hasModifiers ? (
                <>
                  <Plus className="size-4" strokeWidth={2.5} />
                  <span>Elegir</span>
                </>
              ) : (
                <Plus className="size-5" strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>

        {/* Imagen — derecha, más grande */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 128px, 160px"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-primary-300 flex items-center justify-center">
              <span className="text-4xl opacity-40">🍽️</span>
            </div>
          )}

          {/* Badge descuento sobre imagen */}
          {hasDiscount && (
            <div className="absolute top-2 left-2 bg-warning-500 text-white text-body-xs font-bold px-1.5 py-0.5 rounded-md">
              -{discountPct}%
            </div>
          )}

          {/* No disponible overlay */}
          {!product.isAvailable && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="text-body-xs font-medium text-neutral-500">
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
            className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-sm p-5"
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
                className="flex-1 h-11 rounded-md border border-neutral-200 text-body-md font-medium text-neutral-700 hover:bg-neutral-100 transition"
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