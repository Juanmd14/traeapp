"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type StoreOrderRow = {
  id: string;
  order_number: number;
  status:
    | "pending" | "confirmed" | "preparing" | "ready"
    | "picked_up" | "delivered" | "completed" | "cancelled" | "rejected";
  payment_method: "cash" | "mercadopago" | "card_on_delivery";
  payment_status: "pending" | "authorized" | "approved" | "rejected" | "refunded" | "cancelled";
  total: number;
  customer_notes: string | null;
  delivery_address_text: string;
  created_at: string;
  confirmed_at: string | null;
  ready_at: string | null;
  customer_id: string;
};

/**
 * Suscribe a INSERTs y UPDATEs de la tabla `orders` filtrando por store_id.
 * Mantiene la lista actualizada en memoria.
 *
 * Reproduce un sonido cuando entra un pedido nuevo (status = pending o confirmed).
 */
export function useStoreOrders(storeId: string, initial: StoreOrderRow[]) {
  const [orders, setOrders] = useState<StoreOrderRow[]>(initial);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const knownIdsRef = useRef<Set<string>>(new Set(initial.map((o) => o.id)));

  // Pre-cargar el audio
  useEffect(() => {
    if (typeof window === "undefined") return;
    audioRef.current = new Audio("/sounds/new-order.mp3");
    audioRef.current.preload = "auto";
    audioRef.current.volume = 0.7;
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`store:${storeId}:orders`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          const row = payload.new as StoreOrderRow;
          if (knownIdsRef.current.has(row.id)) return;
          knownIdsRef.current.add(row.id);
          setOrders((prev) => [row, ...prev]);

          // Suena solo si es un pedido activo (pending o confirmed)
          if (row.status === "pending" || row.status === "confirmed") {
            audioRef.current?.play().catch(() => {
              // Auto-play bloqueado: el usuario tiene que interactuar primero
            });
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          const row = payload.new as StoreOrderRow;
          setOrders((prev) =>
            prev.map((o) => (o.id === row.id ? { ...o, ...row } : o)),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  return orders;
}
