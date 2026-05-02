"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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

const ACTIVE_STATUSES = ["pending", "confirmed", "preparing", "ready"];

type OrderPatch = Partial<StoreOrderRow> & { id: string };

function mergeOrder(existing: StoreOrderRow, patch: OrderPatch): StoreOrderRow {
  return { ...existing, ...patch };
}

/** Firma estable para detectar cuando el SSR trae datos nuevos (p. ej. tras router.refresh()). */
function ordersSyncKey(rows: StoreOrderRow[]): string {
  return [...rows]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(
      (o) =>
        `${o.id}:${o.status}:${o.payment_status}:${o.confirmed_at ?? ""}:${o.ready_at ?? ""}`,
    )
    .join("|");
}

export function useStoreOrders(storeId: string, initial: StoreOrderRow[]) {
  const [orders, setOrders] = useState<StoreOrderRow[]>(initial);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const knownIdsRef = useRef<Set<string>>(new Set(initial.map((o) => o.id)));
  const serverSyncKeyRef = useRef<string | null>(null);

  // Cuando el servidor revalida (router.refresh), alinear estado local con `initial`.
  useEffect(() => {
    const key = ordersSyncKey(initial);
    if (serverSyncKeyRef.current === null) {
      serverSyncKeyRef.current = key;
      return;
    }
    if (serverSyncKeyRef.current !== key) {
      serverSyncKeyRef.current = key;
      setOrders(initial);
      knownIdsRef.current = new Set(initial.map((o) => o.id));
    }
  }, [initial]);

  // Pre-cargar el audio
  useEffect(() => {
    if (typeof window === "undefined") return;
    const audio = new Audio("/sounds/new-order.mp3");
    audio.preload = "auto";
    audio.volume = 0.7;
    audio.onerror = () => {
      audioRef.current = null;
    };
    audioRef.current = audio;
  }, []);

  const playSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } else {
      try {
        const ctx = new AudioContext();
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0.3;
        gain.connect(ctx.destination);
        osc1.frequency.value = 880;
        osc1.connect(gain);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.15);
        osc2.frequency.value = 659;
        osc2.connect(gain);
        osc2.start(ctx.currentTime + 0.2);
        osc2.stop(ctx.currentTime + 0.35);
        setTimeout(() => ctx.close(), 500);
      } catch {
        /* noop */
      }
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token);
      }
    })();

    const {
      data: { subscription: authSub },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token);
      }
    });

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

          if (row.status === "pending" || row.status === "confirmed") {
            playSound();
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
          const patch = payload.new as OrderPatch;

          setOrders((prev) => {
            const existing = prev.find((o) => o.id === patch.id);
            const merged = existing ? mergeOrder(existing, patch) : (patch as StoreOrderRow);
            const status = merged.status;

            if (!ACTIVE_STATUSES.includes(status)) {
              return prev.filter((o) => o.id !== patch.id);
            }
            if (existing) {
              return prev.map((o) => (o.id === patch.id ? merged : o));
            }
            return [merged, ...prev];
          });
        },
      )
      .subscribe();

    return () => {
      authSub.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [storeId, playSound]);

  return orders;
}
