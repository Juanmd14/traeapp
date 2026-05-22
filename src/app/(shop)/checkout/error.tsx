"use client";

import { ErrorFallback } from "@/components/ui/error-fallback";

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="No pudimos procesar tu pedido"
      description="Algo falló al armar el checkout. Tu carrito sigue intacto — podés reintentar o revisarlo."
      secondaryAction={{ href: "/carrito", label: "Volver al carrito" }}
    />
  );
}
