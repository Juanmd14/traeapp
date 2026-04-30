"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: enviar a Sentry / log centralizado
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <h2 className="text-heading-xl font-semibold text-neutral-900 mb-2">
          Algo salió mal
        </h2>
        <p className="text-body-md text-neutral-500 mb-6">
          Disculpá las molestias. Intentá de nuevo en un momento.
        </p>
        <button
          onClick={reset}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-5 py-2.5 rounded-md transition"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
