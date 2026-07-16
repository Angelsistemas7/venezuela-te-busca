"use client";

import { CircleMarker, MapContainer, Marker, TileLayer, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MiniZone = { key: string; name: string; lat: number; lng: number; count: number };
export type MiniPoint = { id: string; lat: number; lng: number; label: string };

function dotIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:12px;height:12px;border-radius:9999px;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

// Vista reducida, no interactiva más allá del hover: pensada para una tarjeta
// de "vistazo" que invita a abrir /mapa, no para explorar a fondo ahí mismo.
export default function MiniMapView({
  zones,
  aidPoints,
  hospitals,
  center,
  zoom = 7,
}: {
  zones: MiniZone[];
  aidPoints: MiniPoint[];
  hospitals: MiniPoint[];
  center: [number, number];
  zoom?: number;
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={false}
      zoomControl={false}
      attributionControl={false}
      dragging={false}
      doubleClickZoom={false}
      className="h-full w-full"
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
      {zones.map((z) => (
        <CircleMarker
          key={z.key}
          center={[z.lat, z.lng]}
          radius={Math.max(7, Math.min(18, 5 + Math.sqrt(z.count) * 2.2))}
          pathOptions={{ color: "#fff", weight: 2, fillColor: "#e11d48", fillOpacity: 0.75 }}
        >
          <Tooltip direction="top">
            {z.name} · {z.count}
          </Tooltip>
        </CircleMarker>
      ))}
      {aidPoints.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={dotIcon("#d3824a")}>
          <Tooltip direction="top">{p.label}</Tooltip>
        </Marker>
      ))}
      {hospitals.map((h) => (
        <Marker key={h.id} position={[h.lat, h.lng]} icon={dotIcon("#059669")}>
          <Tooltip direction="top">{h.label}</Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
