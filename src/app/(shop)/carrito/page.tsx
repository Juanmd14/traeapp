"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag, ChevronLeft } from "lucide-react";

import { useCart } from "@/stores/cart";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export default function CarritoPage() {
  const [hydrated, setHydrated] = useState(false);
  const items = useCart((s) => s.items);
  const storeName = useCart((s) => s.storeName);
  const storeSlug = useCart((s) => s.storeSlug);
  const subtotal = useCart((s) => s.getSubtotal());
  const total = useCart((s) => s.getTotal());
  const deliveryFee = useCart((s) => s.deliveryFee);
  const minOrderAmount = useCart((s) => s.minOrderAmount);
  const meetsMin = useCart((s) => s.meetsMinimum());
  const increment = useCart((s) => s.increment);
  const decrement = useCart((s) => s.decrement);
  const remove = useCart((s) => s.remove);

  // Evitar mismatch de hydration con persisted store
  if (typeof window !== "undefined" && !hydrated) {
    setTimeout(() => setHydrated(true), 0);
  }

  if (typeof window !== "undefined" && !hydrated) {
    return <div className="container-shop py-8" />;
  }

  if (items.length === 0) {
    return (
      <div className="container-shop py-12 text-center">
        <div className="size-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="size-7 text-neutral-400" />
        </div>
        <h1 className="text-heading-lg font-semibold text-neutral-900 mb-2">
          Tu carrito está vacío
        </h1>
        <p className="text-body-md text-neutral-500 mb-6">
          Explorá los comercios y agregá productos.
        </p>
        <Button asChild size="lg">
          <Link href="/">Ver comercios</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container-shop py-4 pb-10">
      <Link
        href={storeSlug ? `/s/${storeSlug}` : "/"}
        className="inline-flex items-center gap-1 text-body-sm text-neutral-500 hover:text-neutral-900 mb-3"
      >
        <ChevronLeft className="size-4" />
        Volver
      </Link>

      <header className="mb-5">
        <h1 className="text-heading-xl font-semibold text-neutral-900">
          Tu carrito
        </h1>
        {storeName && (
          <p className="text-body-md text-neutral-500 mt-0.5">
            En {storeName}
          </p>
        )}
      </header>

      <ul className="space-y-2.5 mb-6">
        {items.map((item) => {
          const lineSubtotal =
            (item.unitPrice + (item.modifiers?.reduce((a, m) => a + m.priceDelta, 0) ?? 0)) *
            item.quantity;

          return (
            <li
              key={item.lineId}
              className="bg-white dark:bg-neutral-900 rounded-md border border-neutral-200 dark:border-neutral-800 p-3 flex gap-3"
            >
              <div className="shrink-0 size-16 bg-neutral-100 dark:bg-neutral-800 rounded-md overflow-hidden relative">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-200 to-primary-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-body-md font-medium text-neutral-900 truncate">
                  {item.name}
                </h3>
                {item.modifiers && item.modifiers.length > 0 && (
                  <p className="text-body-xs text-neutral-500 truncate">
                    {item.modifiers.map((m) => m.name).join(", ")}
                  </p>
                )}
                <p className="text-body-sm text-neutral-700 mt-1">
                  {formatPrice(lineSubtotal)}
                </p>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-md p-0.5">
                    <button
                      onClick={() => decrement(item.lineId)}
                      className="size-7 rounded-md hover:bg-white dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center justify-center transition"
                      aria-label="Restar"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="px-2 text-body-sm font-medium min-w-[24px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => increment(item.lineId)}
                      className="size-7 rounded-md hover:bg-white dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center justify-center transition"
                      aria-label="Sumar"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => remove(item.lineId)}
                    className="text-neutral-400 hover:text-destructive p-1 transition"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Resumen */}
      <div className="bg-white dark:bg-neutral-900 rounded-md border border-neutral-200 dark:border-neutral-800 p-4 space-y-2">
        <div className="flex justify-between text-body-md">
          <span className="text-neutral-600">Subtotal</span>
          <span className="text-neutral-900">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-body-md">
          <span className="text-neutral-600">Envío</span>
          <span className={deliveryFee === 0 ? "text-accent-600 font-medium" : "text-neutral-900"}>
            {deliveryFee === 0 ? "Gratis" : formatPrice(deliveryFee)}
          </span>
        </div>
        <div className="border-t border-neutral-200 pt-2 flex justify-between text-heading-md font-semibold">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      {!meetsMin && minOrderAmount > 0 && (
        <p className="mt-3 text-body-sm text-warning-700 dark:text-warning-400 bg-warning-50 dark:bg-warning-950/30 px-3 py-2 rounded-md">
          Te faltan <strong>{formatPrice(minOrderAmount - subtotal)}</strong> para alcanzar el mínimo de {formatPrice(minOrderAmount)}.
        </p>
      )}

      <div className="mt-5">
        <Button asChild fullWidth size="lg" variant="success" disabled={!meetsMin}>
          <Link href="/checkout">Continuar con el pago</Link>
        </Button>
      </div>
    </div>
  );
}
