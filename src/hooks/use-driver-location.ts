"use client";

import { useEffect } from "react";
import { pushLocationAction } from "@/server/actions/driver";

export function useDriverLocation(deliveryId: string | null, isActive: boolean) {
  useEffect(() => {
    if (!deliveryId || !isActive || typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    const sendLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          pushLocationAction({
            deliveryId: deliveryId!,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speedKmh: pos.coords.speed != null ? pos.coords.speed * 3.6 : undefined,
          });
        },
        (err) => console.warn("[GPS]", err.message),
        { enableHighAccuracy: true, maximumAge: 10_000, timeout: 8_000 },
      );
    };

    sendLocation();
    const interval = setInterval(sendLocation, 15_000);
    return () => clearInterval(interval);
  }, [deliveryId, isActive]);
}
