"use client";

import { Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOrderRealtime } from "@/hooks/use-order-realtime";
import { DeliveryMapLive } from "@/components/map/delivery-map-live";

type Props = {
  orderId: string;
  initial: {
    status: any;
    payment_status: string;
    estimated_delivery_at: string | null;
    driver_id: string | null;
    confirmed_at: string | null;
    ready_at: string | null;
    picked_up_at: string | null;
    delivered_at: string | null;
  };
  destLat: number | null;
  destLng: number | null;
};

export function OrderMapSection({ orderId, initial, destLat, destLng }: Props) {
  const order = useOrderRealtime(orderId, initial);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);

  const showMap =
    order.driver_id !== null &&
    ["ready", "picked_up"].includes(order.status);

  useEffect(() => {
    if (!showMap || !order.driver_id) {
      setDriverPos(null);
      return;
    }

    const supabase = createClient();
    const fetchPos = async () => {
      const { data } = await (supabase.from("driver_status") as any)
        .select("current_lat, current_lng")
        .eq("driver_id", order.driver_id)
        .maybeSingle();
      if (data?.current_lat && data?.current_lng) {
        setDriverPos({ lat: Number(data.current_lat), lng: Number(data.current_lng) });
      }
    };
    void fetchPos();
  }, [showMap, order.driver_id]);

  if (!showMap || !driverPos || !order.driver_id) return null;

  return (
    <section className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Truck className="size-4 text-primary" />
        <p className="text-body-sm font-medium text-neutral-700">
          {order.status === "picked_up"
            ? "Tu repartidor está en camino"
            : "Repartidor asignado"}
        </p>
        <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
      </div>
      <DeliveryMapLive
        driverId={order.driver_id}
        initialLat={driverPos.lat}
        initialLng={driverPos.lng}
        destLat={destLat}
        destLng={destLng}
      />
    </section>
  );
}
