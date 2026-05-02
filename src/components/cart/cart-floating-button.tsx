"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/stores/cart";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag, ArrowRight } from "lucide-react";

const HIDDEN_ROUTES = ["/carrito", "/checkout", "/pedido"];

export function CartFloatingButton() {
  const pathname = usePathname();
  const items = useCart((s) => s.items);
  const itemCount = useCart((s) => s.getItemCount());
  const total = useCart((s) => s.getTotal());

  if (items.length === 0) return null;

  if (HIDDEN_ROUTES.some((route) => pathname.startsWith(route))) {
    return null;
  }

  return (
    <div className="fixed bottom-20 sm:bottom-6 inset-x-0 z-30 px-4 pointer-events-none animate-slide-up">
      <div className="container-shop pointer-events-auto">
        <Link
          href="/carrito"
          className="bg-accent-600 hover:bg-accent-700 text-white rounded-full flex items-center justify-between px-5 py-3 shadow-[0_8px_24px_rgba(34,197,94,0.35)] active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="size-10 bg-white/20 rounded-full flex items-center justify-center relative">
              <ShoppingBag className="size-5" strokeWidth={2.5} />
              <span className="absolute -top-1 -right-1 bg-white text-accent-700 text-[11px] font-bold rounded-full size-5 flex items-center justify-center border-2 border-accent-600">
                {itemCount}
              </span>
            </div>
            <div>
              <p className="text-body-xs opacity-90 leading-tight">
                {itemCount} {itemCount === 1 ? "producto" : "productos"}
              </p>
              <p className="text-body-md font-semibold leading-tight">
                Ver mi carrito
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-heading-sm font-bold">{formatPrice(total)}</p>
            <ArrowRight className="size-5" strokeWidth={2.5} />
          </div>
        </Link>
      </div>
    </div>
  );
}