"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { UserPlus, UserMinus } from "lucide-react";
import { addDriverAction, removeDriverAction } from "@/server/actions/admin";

export function AddDriverForm() {
  const [email, setEmail] = useState("");

  const { execute, isPending } = useAction(addDriverAction, {
    onSuccess: () => {
      toast.success("Repartidor asignado");
      setEmail("");
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Error"),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (email.trim()) execute({ email: email.trim() });
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
        disabled={isPending || !email.trim()}
        className="flex items-center gap-1.5 bg-primary text-white text-body-sm font-medium px-3 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 transition whitespace-nowrap"
      >
        <UserPlus className="size-4" />
        Agregar
      </button>
    </form>
  );
}

export function RemoveDriverButton({ userId, name }: { userId: string; name: string }) {
  const { execute, isPending } = useAction(removeDriverAction, {
    onSuccess: () => toast.success(`${name} removido como repartidor`),
    onError: ({ error }) => toast.error(error.serverError ?? "Error"),
  });

  return (
    <button
      disabled={isPending}
      onClick={() => execute({ userId })}
      className="flex items-center gap-1 text-body-xs text-neutral-400 hover:text-red-600 transition disabled:opacity-50"
      title="Quitar repartidor"
    >
      <UserMinus className="size-3.5" />
      Quitar
    </button>
  );
}
