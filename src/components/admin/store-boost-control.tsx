"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Rocket } from "lucide-react";
import { updateStoreBoostAction } from "@/server/actions/admin";

/** Devuelve "YYYY-MM-DD" a partir de un ISO, o "" si es null. */
function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

export function StoreBoostControl({
  storeId,
  boostRank,
  boostExpiresAt,
}: {
  storeId: string;
  boostRank: number;
  boostExpiresAt: string | null;
}) {
  const router = useRouter();
  const [rank, setRank] = useState(boostRank);
  const [expires, setExpires] = useState(toDateInput(boostExpiresAt));

  const expired =
    boostRank > 0 && boostExpiresAt
      ? new Date(boostExpiresAt).getTime() < Date.now()
      : false;

  const { execute, isPending } = useAction(updateStoreBoostAction, {
    onSuccess: () => {
      toast.success("Posición actualizada");
      router.refresh();
    },
    onError: ({ error }) =>
      toast.error(error.serverError ?? "Error al actualizar"),
  });

  const save = (nextRank: number, nextExpires: string) =>
    execute({
      storeId,
      boostRank: nextRank,
      expiresAt: nextExpires || null,
    });

  return (
    <div className="flex items-center gap-2">
      <Rocket
        className={`size-4 ${
          rank > 0 && !expired ? "text-primary" : "text-neutral-300"
        }`}
      />
      <input
        type="number"
        min={0}
        max={100}
        value={rank}
        disabled={isPending}
        onChange={(e) => setRank(Number(e.target.value))}
        onBlur={() => rank !== boostRank && save(rank, expires)}
        title="Posición (0 = sin destacar, mayor = más arriba)"
        className="w-14 text-body-xs border border-neutral-200 rounded-md px-2 py-1 bg-white text-neutral-700 disabled:opacity-50"
      />
      <input
        type="date"
        value={expires}
        disabled={isPending || rank === 0}
        onChange={(e) => setExpires(e.target.value)}
        onBlur={() => expires !== toDateInput(boostExpiresAt) && save(rank, expires)}
        title="Vence el (vacío = sin vencimiento)"
        className="text-body-xs border border-neutral-200 rounded-md px-2 py-1 bg-white text-neutral-700 disabled:opacity-50"
      />
      {expired && (
        <span className="text-[11px] text-warning-600 font-medium whitespace-nowrap">
          vencido
        </span>
      )}
    </div>
  );
}
