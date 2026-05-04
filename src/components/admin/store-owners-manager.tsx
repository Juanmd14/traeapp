"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";
import { addStoreOwnerAction, removeStoreOwnerAction } from "@/server/actions/admin";

type Owner = {
  user_id: string;
  role: string;
  profiles: { full_name: string; email: string } | null;
};

export function StoreOwnersManager({
  storeId,
  owners,
}: {
  storeId: string;
  owners: Owner[];
}) {
  const [email, setEmail] = useState("");

  const { execute: addOwner, isPending: adding } = useAction(addStoreOwnerAction, {
    onSuccess: () => {
      toast.success("Dueño asignado");
      setEmail("");
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Error"),
  });

  const { execute: removeOwner, isPending: removing } = useAction(removeStoreOwnerAction, {
    onSuccess: () => toast.success("Dueño eliminado"),
    onError: ({ error }) => toast.error(error.serverError ?? "Error"),
  });

  return (
    <div className="space-y-4">
      {owners.length === 0 ? (
        <p className="text-body-sm text-neutral-500">Sin dueños asignados.</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {owners.map((o) => (
            <li key={o.user_id} className="flex items-center justify-between py-2.5 gap-3">
              <div className="min-w-0">
                <p className="text-body-sm font-medium text-neutral-900 truncate">
                  {o.profiles?.full_name ?? "—"}
                </p>
                <p className="text-body-xs text-neutral-500 truncate">
                  {o.profiles?.email ?? "—"} · {o.role}
                </p>
              </div>
              <button
                disabled={removing}
                onClick={() => removeOwner({ storeId, userId: o.user_id })}
                className="shrink-0 p-1.5 rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                title="Quitar dueño"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim()) addOwner({ storeId, email: email.trim() });
        }}
        className="flex gap-2"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@ejemplo.com"
          required
          className="flex-1 text-body-sm border border-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="submit"
          disabled={adding || !email.trim()}
          className="flex items-center gap-1.5 bg-primary text-white text-body-sm font-medium px-3 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 transition"
        >
          <UserPlus className="size-4" />
          Agregar
        </button>
      </form>
    </div>
  );
}
