"use client";

import { useMemo, useEffect, useState } from "react";
import { Volume2, VolumeX, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useStoreOrders, type StoreOrderRow } from "@/hooks/use-store-orders";
import { KdsOrderCard } from "./kds-order-card";
import { cn } from "@/lib/utils";

type OrderItemMap = Record<string, Array<{
  id: string;
  product_name: string;
  quantity: number;
  total: number;
  notes: string | null;
}>>;

type Props = {
  storeId: string;
  initialOrders: StoreOrderRow[];
  itemsByOrder: OrderItemMap;
};

export function StoreKds({ storeId, initialOrders, itemsByOrder }: Props) {
  const orders = useStoreOrders(storeId, initialOrders);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Actualizar tiempo cada minuto
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Forzar interacción para habilitar audio
  useEffect(() => {
    const handler = () => setHasInteracted(true);
    document.addEventListener("click", handler, { once: true });
    return () => document.removeEventListener("click", handler);
  }, []);

  const { newOrders, preparingOrders, readyOrders, metrics } = useMemo(() => {
    const newO: StoreOrderRow[] = [];
    const prep: StoreOrderRow[] = [];
    const ready: StoreOrderRow[] = [];
    let totalWaitTime = 0;
    let completedToday = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    orders.forEach((o) => {
      if (o.status === "pending" || o.status === "confirmed") {
        if (o.payment_method === "cash" || o.payment_status === "approved") {
          newO.push(o);
          totalWaitTime += (Date.now() - new Date(o.created_at).getTime()) / 60000;
        }
      } else if (o.status === "preparing") {
        prep.push(o);
        totalWaitTime += (Date.now() - new Date(o.created_at).getTime()) / 60000;
      } else if (o.status === "ready") {
        ready.push(o);
      }
      
      // Contar completados de hoy
      const orderDate = new Date(o.created_at);
      if (orderDate >= today && (o.status === "completed" || o.status === "delivered")) {
        completedToday++;
      }
    });

    // Ordenar por created_at asc (más viejos primero — "first in, first out")
    newO.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    prep.sort((a, b) => +new Date(a.confirmed_at ?? a.created_at) - +new Date(b.confirmed_at ?? b.created_at));
    ready.sort((a, b) => +new Date(a.ready_at ?? a.created_at) - +new Date(b.ready_at ?? b.created_at));

    const avgWait = newO.length + prep.length > 0 
      ? Math.round(totalWaitTime / (newO.length + prep.length)) 
      : 0;

    return { 
      newOrders: newO, 
      preparingOrders: prep, 
      readyOrders: ready,
      metrics: {
        pending: newO.length,
        preparing: prep.length,
        ready: ready.length,
        completedToday,
        avgWaitTime: avgWait,
      }
    };
  }, [orders]);

  return (
    <div className="space-y-4">
      {/* Header con métricas */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-neutral-400" />
              <span className="text-body-sm text-neutral-500">
                Tiempo avg: <strong className="text-neutral-900">{metrics.avgWaitTime}m</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="size-4 text-accent-500" />
              <span className="text-body-sm text-neutral-500">
                Hoy: <strong className="text-neutral-900">{metrics.completedToday}</strong> pedidos
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Indicador de pedidos urgentes */}
            {metrics.avgWaitTime >= 10 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-body-xs">
                <AlertCircle className="size-3.5" />
                Tiempo elevado
              </span>
            )}
            
            <button
              type="button"
              onClick={() => setSoundEnabled((v) => !v)}
              className="text-body-xs text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1.5 transition"
            >
              {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
              Sonido {soundEnabled ? "on" : "off"}
            </button>
          </div>
        </div>
      </div>

      {/* Aviso de interacción para sonido */}
      {!hasInteracted && metrics.pending === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-body-sm text-blue-800 flex items-center gap-2">
          <Volume2 className="size-4 shrink-0" />
          <span>Tocá cualquier lugar para activar el sonido de pedidos nuevos</span>
        </div>
      )}

      {/* Columnas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Column
          title="Nuevos"
          count={newOrders.length}
          color="primary"
          empty="No hay pedidos nuevos"
        >
          {newOrders.map((o) => (
            <KdsOrderCard
              key={o.id}
              order={o}
              items={itemsByOrder[o.id]}
              variant="new"
            />
          ))}
        </Column>

        <Column
          title="Preparando"
          count={preparingOrders.length}
          color="warning"
          empty="Nada en preparación"
        >
          {preparingOrders.map((o) => (
            <KdsOrderCard
              key={o.id}
              order={o}
              items={itemsByOrder[o.id]}
              variant="preparing"
            />
          ))}
        </Column>

        <Column
          title="Listos"
          count={readyOrders.length}
          color="accent"
          empty="Nada listo aún"
        >
          {readyOrders.map((o) => (
            <KdsOrderCard
              key={o.id}
              order={o}
              items={itemsByOrder[o.id]}
              variant="ready"
            />
          ))}
        </Column>
      </div>
    </div>
  );
}

function Column({
  title, count, color, empty, children,
}: {
  title: string;
  count: number;
  color: "primary" | "warning" | "accent";
  empty: string;
  children: React.ReactNode;
}) {
  const colorMap = {
    primary: "bg-primary-500",
    warning: "bg-warning-500",
    accent: "bg-accent-500",
  };

  return (
    <section>
      <header className="flex items-center gap-2 mb-3 sticky top-0 bg-neutral-50 py-2 -mx-2 px-2 z-10">
        <span className={cn("size-2 rounded-full animate-pulse", colorMap[color])} />
        <h2 className="text-body-md font-semibold uppercase tracking-wider text-neutral-700">
          {title}
        </h2>
        <span className={cn(
          "text-body-md font-semibold px-2 py-0.5 rounded-full",
          color === "primary" && "bg-primary-100 text-primary-700",
          color === "warning" && "bg-warning-100 text-warning-700",
          color === "accent" && "bg-accent-100 text-accent-700"
        )}>
          {count}
        </span>
      </header>
      {count === 0 ? (
        <div className="bg-neutral-100 border-2 border-dashed border-neutral-200 rounded-lg p-6 text-center">
          <p className="text-body-sm text-neutral-400">{empty}</p>
        </div>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </section>
  );
}