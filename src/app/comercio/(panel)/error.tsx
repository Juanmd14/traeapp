"use client";

import { ErrorFallback } from "@/components/ui/error-fallback";

export default function PanelError({
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
      title="Error en el panel"
      description="No pudimos cargar este módulo. Reintentá o probá refrescar la página."
      secondaryAction={{ href: "/comercio/pedidos", label: "Ir a pedidos" }}
    />
  );
}
