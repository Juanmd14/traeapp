"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

const DeliveryMapInner = dynamic(
  () => import("./delivery-map-inner").then((m) => m.DeliveryMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="h-[260px] w-full rounded-2xl bg-neutral-100 animate-pulse border border-neutral-200 dark:bg-neutral-800" />
    ),
  },
);

type Props = {
  driverId: string;
  initialLat: number;
  initialLng: number;
  destLat: number | null;
  destLng: number | null;
};

export function DeliveryMapLive(props: Props) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="h-[260px] w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 flex flex-col items-center justify-center text-neutral-500 dark:text-neutral-400 gap-2">
        <MapPin className="size-8" />
        <p className="text-body-sm">Mapa no disponible</p>
      </div>
    );
  }

  return (
    <div>
      <DeliveryMapInner {...props} />
    </div>
  );
}
