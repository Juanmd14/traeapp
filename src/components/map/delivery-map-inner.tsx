"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const driverIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;background:#E63823;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const destIcon = L.divIcon({
  className: "",
  html: `<svg viewBox="0 0 24 34" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:28px;height:34px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.25))"><path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 22 12 22S24 21 24 12C24 5.37 18.63 0 12 0z" fill="#16A34A"/><circle cx="12" cy="12" r="5" fill="white"/></svg>`,
  iconSize: [28, 34],
  iconAnchor: [14, 34],
});

function MapFollower({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.panTo(position, { animate: true, duration: 1.2 });
  }, [position, map]);
  return null;
}

type Props = {
  driverId: string;
  initialLat: number;
  initialLng: number;
  destLat: number | null;
  destLng: number | null;
};

export function DeliveryMapInner({ driverId, initialLat, initialLng, destLat, destLng }: Props) {
  const [driverPos, setDriverPos] = useState<[number, number]>([initialLat, initialLng]);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const poll = async () => {
      const { data } = await (supabase.from("driver_status") as any)
        .select("current_lat, current_lng")
        .eq("driver_id", driverId)
        .maybeSingle();
      if (data?.current_lat && data?.current_lng) {
        setDriverPos([Number(data.current_lat), Number(data.current_lng)]);
      }
    };
    const id = setInterval(poll, 15_000);
    return () => clearInterval(id);
  }, [driverId]);

  if (mapError) {
    return (
      <div className="h-[260px] w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
        <p className="text-neutral-500 dark:text-neutral-400 text-body-sm">Mapa no disponible</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
      <MapContainer
        center={driverPos}
        zoom={15}
        style={{ height: "260px", width: "100%" }}
        zoomControl={false}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <Marker position={driverPos} icon={driverIcon} />
        {destLat !== null && destLng !== null && (
          <Marker position={[destLat, destLng]} icon={destIcon} />
        )}
        <MapFollower position={driverPos} />
      </MapContainer>
    </div>
  );
}
