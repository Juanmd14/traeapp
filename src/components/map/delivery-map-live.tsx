"use client";

import dynamic from "next/dynamic";

const DeliveryMapInner = dynamic(
  () => import("./delivery-map-inner").then((m) => m.DeliveryMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="h-[260px] w-full rounded-2xl bg-neutral-100 animate-pulse border border-neutral-200" />
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
  return <DeliveryMapInner {...props} />;
}
