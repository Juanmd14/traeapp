"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type OrderStatus =
  | "pending" | "confirmed" | "preparing" | "ready"
  | "picked_up" | "delivered" | "completed" | "cancelled" | "rejected";

type OrderRealtime = {
  status: OrderStatus;
  payment_status: string;
  estimated_delivery_at: string | null;
  driver_id: string | null;
  confirmed_at: string | null;
  ready_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
};

export function useOrderRealtime(orderId: string, initial: OrderRealtime) {
  const [order, setOrder] = useState<OrderRealtime>(initial);

  useEffect(() => {
    const supabase = createClient();

    let channel: ReturnType<typeof supabase.channel>;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token);
      }

      channel = supabase
        .channel(`order:${orderId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `id=eq.${orderId}`,
          },
          (payload) => {
            const next = payload.new as OrderRealtime;
            setOrder((prev) => ({ ...prev, ...next }));
          },
        )
        .subscribe();
    };

    const {
      data: { subscription: authSub },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token);
      }
    });

    void init();

    return () => {
      authSub.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, [orderId]);

  return order;
}
