"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
  secondaryAction?: { href: string; label: string };
};

export function ErrorFallback({
  error,
  reset,
  title = "Algo salió mal",
  description = "Disculpá las molestias. Podés reintentar o volver más tarde.",
  secondaryAction,
}: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" />
        </div>
        <h2 className="text-heading-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          {title}
        </h2>
        <p className="text-body-md text-neutral-500 dark:text-neutral-400 mb-6">
          {description}
        </p>
        {error.digest && (
          <p className="text-body-xs text-neutral-400 dark:text-neutral-500 mb-6 font-mono">
            ref: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button onClick={reset}>Reintentar</Button>
          {secondaryAction && (
            <Button variant="ghost" asChild>
              <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
