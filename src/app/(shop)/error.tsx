"use client";

import { ErrorFallback } from "@/components/ui/error-fallback";

export default function ShopError({
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
      title="No pudimos cargar esta sección"
      description="Hubo un problema al traer la información. Volvé a intentarlo en unos segundos."
      secondaryAction={{ href: "/", label: "Volver al inicio" }}
    />
  );
}
