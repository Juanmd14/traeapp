"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { adminCreateStoreAction } from "@/server/actions/admin";

export function CreateStoreForm() {
  const [acceptsCash, setAcceptsCash] = useState(true);
  const [acceptsMp, setAcceptsMp] = useState(false);

  const { execute, isPending } = useAction(adminCreateStoreAction, {
    onError: ({ error }) => toast.error(error.serverError ?? "Error al crear el comercio"),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    execute({
      name: fd.get("name") as string,
      address: fd.get("address") as string,
      description: (fd.get("description") as string) || undefined,
      phone: (fd.get("phone") as string) || undefined,
      email: (fd.get("email") as string) || undefined,
      deliveryFee: Number(fd.get("deliveryFee") ?? 0),
      minOrderAmount: Number(fd.get("minOrderAmount") ?? 0),
      avgPrepMinutes: Number(fd.get("avgPrepMinutes") ?? 30),
      acceptsCash,
      acceptsMp,
    });
  };

  const inputCls = "w-full text-body-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-neutral-50";
  const labelCls = "block text-body-xs font-medium text-neutral-600 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
        <h2 className="text-body-md font-semibold text-neutral-800">Información básica</h2>

        <div>
          <label className={labelCls}>Nombre *</label>
          <input name="name" required disabled={isPending} className={inputCls} placeholder="Ej: Burger House" />
        </div>

        <div>
          <label className={labelCls}>Dirección *</label>
          <input name="address" required disabled={isPending} className={inputCls} placeholder="Ej: Av. Corrientes 1234, CABA" />
        </div>

        <div>
          <label className={labelCls}>Descripción</label>
          <textarea name="description" disabled={isPending} rows={3}
            className={`${inputCls} resize-none`} placeholder="Descripción breve del comercio" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Teléfono</label>
            <input name="phone" disabled={isPending} className={inputCls} placeholder="+54 9 11 ..." />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input name="email" type="email" disabled={isPending} className={inputCls} placeholder="contacto@comercio.com" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
        <h2 className="text-body-md font-semibold text-neutral-800">Operación</h2>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Costo de envío ($)</label>
            <input name="deliveryFee" type="number" min="0" step="0.01" defaultValue="0"
              disabled={isPending} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Pedido mínimo ($)</label>
            <input name="minOrderAmount" type="number" min="0" step="0.01" defaultValue="0"
              disabled={isPending} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Tiempo prep. (min)</label>
            <input name="avgPrepMinutes" type="number" min="5" max="180" defaultValue="30"
              disabled={isPending} className={inputCls} />
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={acceptsCash} onChange={e => setAcceptsCash(e.target.checked)}
              disabled={isPending} className="size-4 rounded" />
            <span className="text-body-sm text-neutral-700">Acepta efectivo</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={acceptsMp} onChange={e => setAcceptsMp(e.target.checked)}
              disabled={isPending} className="size-4 rounded" />
            <span className="text-body-sm text-neutral-700">Acepta Mercado Pago</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <a href="/admin/comercios"
          className="px-4 py-2 text-body-sm font-medium text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition">
          Cancelar
        </a>
        <button type="submit" disabled={isPending}
          className="px-5 py-2 text-body-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition">
          {isPending ? "Creando…" : "Crear comercio"}
        </button>
      </div>
    </form>
  );
}
