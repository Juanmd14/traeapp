"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { setDriverOnlineAction } from "@/server/actions/driver";
import { cn } from "@/lib/utils";

export function DriverOnlineToggle({ initialOnline }: { initialOnline: boolean }) {
  const [isOnline, setIsOnline] = useState(initialOnline);

  const { execute, isPending } = useAction(setDriverOnlineAction, {
    onSuccess: ({ data }) => {
      const next = !isOnline;
      setIsOnline(next);
      toast.success(next ? "Estás en línea. Podés tomar pedidos." : "Estás fuera de línea.");
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Error al cambiar estado");
    },
  });

  return (
    <button
      onClick={() => execute({ isOnline: !isOnline })}
      disabled={isPending}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition",
        isOnline
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
        isPending && "opacity-60 cursor-not-allowed",
      )}
    >
      <span className={cn(
        "size-2 rounded-full",
        isOnline ? "bg-green-500 animate-pulse" : "bg-neutral-400"
      )} />
      {isPending ? "..." : isOnline ? "En línea" : "Fuera de línea"}
    </button>
  );
}
