"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

type Props = {
  orderNumber?: number;
  paymentMethod: "cash" | "mercadopago";
};

export function OrderConfirmedOverlay({ orderNumber, paymentMethod }: Props) {
  // Vibración táctil (mobile)
  useEffect(() => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.([100, 50, 100]);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-white/95 dark:bg-neutral-950/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="text-center max-w-sm animate-slide-up">
        <div className="relative inline-flex mb-6">
          <div className="size-24 rounded-full bg-accent-100 flex items-center justify-center">
            <CheckCircle2
              className="size-14 text-accent-600 animate-in"
              strokeWidth={2}
            />
          </div>
          {/* Anillos animados */}
          <span className="absolute inset-0 rounded-full bg-accent-200 opacity-75 animate-ping" />
        </div>

        <h1 className="text-display-md font-bold text-neutral-900 mb-2">
          ¡Pedido confirmado!
        </h1>
        {orderNumber && (
          <p className="text-body-md text-neutral-500 mb-1">
            Número de pedido
          </p>
        )}
        {orderNumber && (
          <p className="text-heading-lg font-bold text-primary-600 mb-4">
            #{orderNumber}
          </p>
        )}

        <p className="text-body-md text-neutral-600 mb-6">
          {paymentMethod === "cash"
            ? "El comercio va a confirmar tu pedido en unos minutos."
            : "Te llevamos a Mercado Pago para completar el pago..."}
        </p>

        <div className="inline-flex items-center gap-2 text-body-sm text-neutral-500">
          <span className="size-2 rounded-full bg-accent-500 animate-pulse" />
          {paymentMethod === "cash"
            ? "Llevándote al seguimiento del pedido..."
            : "Redirigiendo a Mercado Pago..."}
        </div>
      </div>
    </div>
  );
}