"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export type StoreOrderRow = {
  id: string;
  order_number: number;
  status:
    | "pending" | "confirmed" | "preparing" | "ready"
    | "picked_up" | "delivered" | "completed" | "cancelled" | "rejected";
  total: number;
  payment_method: "cash" | "mercadopago" | "card_on_delivery";
  payment_status: string;
  customer_notes: string | null;
  delivery_address_text: string;
  created_at: string;
  estimated_ready_at: string | null;
  customer_id: string;
  // Joined
  customer?: { full_name: string; phone: string | null } | null;
  items?: Array<{
    id: string;
    product_name: string;
    quantity: number;
    notes: string | null;
  }>;
};

type Options = {
  /** Llamar cuando entra un pedido nuevo (para sonido) */
  onNewOrder?: (order: StoreOrderRow) => void;
};

/**
 * Suscribe a cambios de pedidos del store.
 * Realtime: postgres_changes en INSERT y UPDATE filtrado por store_id.
 */
export function useStoreOrdersRealtime(
  storeId: string,
  initial: StoreOrderRow[],
  options?: Options,
) {
  const [orders, setOrders] = useState<StoreOrderRow[]>(initial);
  // Evitar trigger de sonido en el primer render (el initial ya tiene los pedidos)
  const knownIds = useRef<Set<string>>(new Set(initial.map((o) => o.id)));

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
        async (payload) => {
          const newOrderId = (payload.new as { id: string }).id;
          if (knownIds.current.has(newOrderId)) return;
          knownIds.current.add(newOrderId);

          // Hidratar con joins (Realtime no devuelve relaciones)
          const { data } = await supabase
            .from("orders")
            .select(`
              id, order_number, status, total, payment_method, payment_status,
              customer_notes, delivery_address_text, created_at, estimated_ready_at, customer_id,
              customer:profiles!orders_customer_id_fkey ( full_name, phone ),
              items:order_items ( id, product_name, quantity, notes )
            `)
            .eq("id", newOrderId)
            .single();

          if (data) {
            setOrders((prev) => [data as unknown as StoreOrderRow, ...prev]);
            options?.onNewOrder?.(data as unknown as StoreOrderRow);
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
          const updated = payload.new as StoreOrderRow;
          setOrders((prev) =>
            prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, options]);

  return orders;
}
