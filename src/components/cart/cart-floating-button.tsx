"use client";

import Link from "next/link";
import { useCart } from "@/stores/cart";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";

export function CartFloatingButton() {
  const items = useCart((s) => s.items);
  const itemCount = useCart((s) => s.getItemCount());
  const total = useCart((s) => s.getTotal());

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 inset-x-0 z-30 px-4 pointer-events-none">
      <div className="container-shop pointer-events-auto">
        <Link
          href="/carrito"
          className="bg-neutral-900 text-white rounded-md flex items-center justify-between px-4 py-3 shadow-elevated active:scale-[0.99] transition"
        >
          <div className="flex items-center gap-3">
            <div className="size-9 bg-white/10 rounded-md flex items-center justify-center relative">
              <ShoppingBag className="size-4" />
              <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-[10px] font-bold rounded-full size-4 flex items-center justify-center">
                {itemCount}
              </span>
            </div>
            <div>
              <p className="text-body-xs opacity-70">
                {itemCount} {itemCount === 1 ? "producto" : "productos"}
              </p>
              <p className="text-body-md font-medium">Ver carrito</p>
            </div>
          </div>
          <p className="text-heading-sm font-semibold">{formatPrice(total)}</p>
        </Link>
      </div>
    </div>
  );
}
