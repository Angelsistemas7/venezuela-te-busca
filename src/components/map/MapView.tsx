"use client";

import { MapContainer, Marker, Popup, TileLayer, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type Zone = {
  key: string;
  name: string;
  lat: number;
  lng: number;
  count: number;
  toLocate: number;
  located: number;
  deceased: number;
};
export type AidMarker = {
  id: string;
  name: string;
  typeLabel: string;
  emoji: string;
  lat: number;
  lng: number;
  verified: boolean;
};
export type MarchMarker = { id: string; title: string; lat: number; lng: number; when: string };
export type HospitalMarker = {
  id: string;
  name: string;
  statusLabel: string;
  color: string;
  lat: number;
  lng: number;
};
export type RescueMarker = {
  id: string;
  body: string;
  locationText: string;
  lat: number;
  lng: number;
  when: string;
};

function zoneIcon(count: number) {
  const size = Math.max(28, Math.min(72, 24 + Math.sqrt(count) * 6));
  const label = count > 999 ? `${Math.round(count / 1000)}k` : String(count);
  return L.divIcon({
    className: "",
    html: `<div class="zone-marker" style="--size:${size}px"><span class="zone-pulse"></span><span class="zone-core">${label}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function pinIcon(kind: "aid" | "march", emoji: string) {
  return L.divIcon({
    className: "",
    html: `<div class="pin-marker pin-${kind}"><span>${emoji}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 28],
    popupAnchor: [0, -28],
  });
}

function hospitalIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div class="pin-marker" style="background:${color}"><span>🏥</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 28],
    popupAnchor: [0, -28],
  });
}

function rescueIcon() {
  return L.divIcon({
    className: "",
    html: `<div class="rescue-marker"><span class="rescue-ring"></span><span class="rescue-ring delay"></span><span class="rescue-core">🚨</span></div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -16],
  });
}

function epicenterIcon() {
  return L.divIcon({
    className: "",
    html: `<div class="epicenter-marker"><span class="epi-ring r1"></span><span>⊕</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -14],
  });
}

export default function MapView({
  zones,
  aidPoints,
  marches,
  hospitals,
  rescues,
  epicenter,
  center,
  zoom = 9,
}: {
  zones: Zone[];
  aidPoints: AidMarker[];
  marches: MarchMarker[];
  hospitals: HospitalMarker[];
  rescues: RescueMarker[];
  epicenter?: [number, number] | null;
  center: [number, number];
  zoom?: number;
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      className="h-[68vh] min-h-[460px] w-full rounded-2xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />

      {zones.map((z) => (
        <Marker key={z.key} position={[z.lat, z.lng]} icon={zoneIcon(z.count)}>
          <Tooltip direction="top" offset={[0, -8]} opacity={1}>
            <div style={{ textAlign: "center", lineHeight: 1.5 }}>
              <strong>{z.name}</strong>
              <br />
              <span style={{ color: "#e11d48" }}>{z.toLocate.toLocaleString("es-VE")} por localizar</span>
              <br />
              <span style={{ color: "#059669" }}>{z.located.toLocaleString("es-VE")} localizados</span>
              {z.deceased > 0 && (
                <>
                  <br />
                  <span style={{ color: "#71717a" }}>{z.deceased.toLocaleString("es-VE")} sin vida</span>
                </>
              )}
            </div>
          </Tooltip>
          <Popup>
            <strong>{z.name}</strong>
            <br />
            {z.count.toLocaleString("es-VE")} personas registradas · {z.toLocate} por localizar ·{" "}
            {z.located} localizados
            {z.deceased > 0 ? ` · ${z.deceased} sin vida` : ""}.
          </Popup>
        </Marker>
      ))}

      {aidPoints.map((a) => (
        <Marker key={a.id} position={[a.lat, a.lng]} icon={pinIcon("aid", a.emoji)}>
          <Popup>
            <strong>{a.name}</strong>
            <br />
            {a.typeLabel}
            {a.verified ? " · ✔ verificado" : " · por verificar"}
          </Popup>
        </Marker>
      ))}

      {marches.map((m) => (
        <Marker key={m.id} position={[m.lat, m.lng]} icon={pinIcon("march", "🚐")}>
          <Popup>
            <strong>{m.title}</strong>
            <br />
            Salida: {m.when}
          </Popup>
        </Marker>
      ))}

      {hospitals.map((h) => (
        <Marker key={h.id} position={[h.lat, h.lng]} icon={hospitalIcon(h.color)}>
          <Popup>
            <strong>{h.name}</strong>
            <br />
            Capacidad: {h.statusLabel}
          </Popup>
        </Marker>
      ))}

      {epicenter && (
        <Marker position={epicenter} icon={epicenterIcon()}>
          <Tooltip direction="top" offset={[0, -10]} opacity={1}>
            <strong>Epicentro del sismo</strong>
          </Tooltip>
          <Popup>
            <strong>Epicentro</strong>
            <br />
            ≈28 km al SE de Yumare (Yaracuy), profundidad 10 km.
          </Popup>
        </Marker>
      )}

      {rescues.map((r) => (
        <Marker key={r.id} position={[r.lat, r.lng]} icon={rescueIcon()} zIndexOffset={1000}>
          <Popup>
            <strong>🚨 Rescate urgente</strong>
            {r.locationText && (
              <>
                <br />
                {r.locationText}
              </>
            )}
            <br />
            <span style={{ display: "inline-block", marginTop: 4 }}>{r.body}</span>
            <br />
            <span style={{ color: "#71717a", fontSize: 11 }}>{r.when}</span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
