"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export type AvailableOrder = {
  id: string;
  order_number: number;
  total: number;
  delivery_fee: number;
  delivery_address_text: string;
  ready_at: string | null;
  items_count: number;
  stores: {
    name: string;
    address: string;
  };
};

type Options = {
  onNewOrder?: (order: AvailableOrder) => void;
};

export function useAvailableOrdersRealtime(
  initial: AvailableOrder[],
  options?: Options,
) {
  const [orders, setOrders] = useState<AvailableOrder[]>(initial);
  const knownIds = useRef<Set<string>>(new Set(initial.map((o) => o.id)));
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("driver:available-orders")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        async (payload) => {
          const row = payload.new as {
            id: string;
            status: string;
            driver_id: string | null;
          };

          const isNowAvailable = row.status === "ready" && !row.driver_id;

          if (isNowAvailable && !knownIds.current.has(row.id)) {
            knownIds.current.add(row.id);

            const { data } = await supabase
              .from("orders")
              .select(`
                id, order_number, total, delivery_fee, delivery_address_text, ready_at,
                stores ( name, address ),
                order_items ( quantity )
              `)
              .eq("id", row.id)
              .single();

            if (data) {
              const order: AvailableOrder = {
                id: data.id,
                order_number: data.order_number,
                total: Number(data.total),
                delivery_fee: Number(data.delivery_fee),
                delivery_address_text: data.delivery_address_text,
                ready_at: data.ready_at,
                items_count: (data.order_items as { quantity: number }[]).reduce(
                  (acc, i) => acc + i.quantity,
                  0,
                ),
                stores: data.stores as { name: string; address: string },
              };
              setOrders((prev) => [order, ...prev]);
              optionsRef.current?.onNewOrder?.(order);
            }
          } else if (!isNowAvailable && knownIds.current.has(row.id)) {
            knownIds.current.delete(row.id);
            setOrders((prev) => prev.filter((o) => o.id !== row.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return orders;
}
