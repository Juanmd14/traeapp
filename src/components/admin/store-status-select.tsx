"use client";

import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { updateStoreStatusAction } from "@/server/actions/admin";

const OPTIONS = [
  { value: "active", label: "Activo" },
  { value: "paused", label: "Pausado" },
  { value: "pending_review", label: "En revisión" },
  { value: "draft", label: "Borrador" },
  { value: "closed", label: "Cerrado" },
] as const;

type Status = (typeof OPTIONS)[number]["value"];

export function StoreStatusSelect({
  storeId,
  currentStatus,
}: {
  storeId: string;
  currentStatus: string;
}) {
  const { execute, isPending } = useAction(updateStoreStatusAction, {
    onSuccess: () => toast.success("Estado actualizado"),
    onError: ({ error }) => toast.error(error.serverError ?? "Error al actualizar"),
  });

  return (
    <select
      defaultValue={currentStatus}
      disabled={isPending}
      onChange={(e) => execute({ storeId, status: e.target.value as Status })}
      className="text-body-xs border border-neutral-200 rounded-md px-2 py-1 bg-white text-neutral-700 disabled:opacity-50 cursor-pointer"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
