"use client";

import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pinIcon = L.divIcon({
  className: "",
  html: `<div class="pin-marker pin-need"><span>📍</span></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 28],
});

function ClickCapture({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Recentra el mapa cuando llega una coordenada nueva (p. ej. tras "usar mi
// ubicación") y corrige el tamaño al abrir dentro de un modal.
function Controller({ value }: { value: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 60);
    return () => clearTimeout(t);
  }, [map]);
  useEffect(() => {
    if (value) map.setView(value, Math.max(map.getZoom(), 15));
  }, [map, value]);
  return null;
}

export default function LocationPickerMap({
  value,
  center,
  onChange,
}: {
  value: [number, number] | null;
  center: [number, number];
  onChange: (lat: number, lng: number) => void;
}) {
  return (
    <MapContainer
      center={value ?? center}
      zoom={value ? 15 : 11}
      scrollWheelZoom
      className="h-64 w-full rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <ClickCapture onPick={onChange} />
      <Controller value={value} />
      {value && (
        <Marker
          position={value}
          icon={pinIcon}
          draggable
          eventHandlers={{
            dragend(e) {
              const m = (e.target as L.Marker).getLatLng();
              onChange(m.lat, m.lng);
            },
          }}
        />
      )}
    </MapContainer>
  );
}
