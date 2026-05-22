"use client";

import { ErrorFallback } from "@/components/ui/error-fallback";

export default function DriverError({
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
      title="Error en el módulo de repartidor"
      description="No pudimos cargar tus pedidos. Reintentá o volvé al inicio del módulo."
      secondaryAction={{ href: "/driver", label: "Volver" }}
    />
  );
}
