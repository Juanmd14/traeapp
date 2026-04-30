"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { toggleStoreStatusAction } from "@/server/actions/stores";
import { cn } from "@/lib/utils";

type Props = {
  storeId: string;
  initialActive: boolean;
};

export function StoreStatusToggle({ storeId, initialActive }: Props) {
  const [active, setActive] = useState(initialActive);
  const [isPending, startTransition] = useTransition();

  const handleChange = (next: boolean) => {
    setActive(next); // optimista
    startTransition(async () => {
      const result = await toggleStoreStatusAction({
        storeId,
        pause: !next,
      });
      if (result?.serverError) {
        // revertir si falló
        setActive(!next);
      }
    });
  };

  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full transition",
          active
            ? "bg-accent-100 text-accent-800"
            : "bg-neutral-200 text-neutral-600",
        )}
      >
        <span
          className={cn(
            "size-2 rounded-full transition",
            active ? "bg-accent-600 animate-pulse-soft" : "bg-neutral-400",
          )}
        />
        <span className="text-body-xs font-semibold">
          {active ? "Abierto" : "Cerrado"}
        </span>
      </div>
      <Switch
        checked={active}
        onCheckedChange={handleChange}
        disabled={isPending}
        aria-label="Pausar/reactivar tienda"
      />
    </label>
  );
}
