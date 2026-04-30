"use client";

import Image from "next/image";
import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { useCart } from "@/stores/cart";
import { formatPrice, cn } from "@/lib/utils";

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
  storeId: string;
  storeName: string;
  storeSlug: string;
  deliveryFee: number;
  minOrderAmount: number;
};

export function ProductCard({
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
  const currentStoreId = useCart((s) => s.storeId);
  const currentStoreName = useCart((s) => s.storeName);

  const handleAdd = () => {
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

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  return (
    <>
      <div
        className={cn(
          "bg-white border border-neutral-200 rounded-lg p-3 flex gap-3 relative",
          !product.isAvailable && "opacity-50",
        )}
      >
        <div className="shrink-0 size-20 sm:size-24 bg-neutral-100 rounded-md overflow-hidden relative">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary-200 to-primary-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-body-md font-medium text-neutral-900 line-clamp-1">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-body-sm text-neutral-500 line-clamp-2 mt-0.5">
              {product.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-body-md font-semibold text-neutral-900">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-body-xs text-neutral-400 line-through">
                  {formatPrice(product.compareAtPrice!)}
                </span>
                <span className="bg-warning-100 text-warning-800 text-body-xs font-semibold px-1.5 py-0.5 rounded-full">
                  {discountPct}% off
                </span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={!product.isAvailable}
          className={cn(
            "absolute bottom-3 right-3 size-9 rounded-full flex items-center justify-center transition shadow-primary-sm",
            justAdded
              ? "bg-accent-600 text-white"
              : "bg-primary-600 text-white hover:bg-primary-700 active:scale-95",
          )}
          aria-label="Agregar al carrito"
        >
          {justAdded ? <Check className="size-5" strokeWidth={3} /> : <Plus className="size-5" strokeWidth={2.5} />}
        </button>
      </div>

      {showSwitchModal && (
        <div
          className="fixed inset-0 z-50 bg-neutral-900/60 flex items-end sm:items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowSwitchModal(false)}
        >
          <div
            className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-sm p-5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-heading-md font-semibold text-neutral-900 mb-2">
              ¿Empezar un carrito nuevo?
            </h3>
            <p className="text-body-md text-neutral-600 mb-5">
              Tu carrito tiene productos de <strong>{currentStoreName}</strong>. Si seguís,
              vamos a vaciarlo y agregar este producto de <strong>{storeName}</strong>.
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
