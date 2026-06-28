"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Crosshair, Loader2, MapPin, X } from "lucide-react";

const PickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 w-full items-center justify-center rounded-xl bg-zinc-100 text-sm text-zinc-400">
      Cargando mapa…
    </div>
  ),
});

// Selector de ubicación: toca el mapa para soltar el pin, arrástralo, o usa tu
// GPS. Escribe lat/lng en inputs ocultos para que el formulario los envíe. Así
// el punto queda exactamente donde es, sin aproximaciones que caigan al mar.
export function LocationPicker({
  defaultCenter = [10.601, -66.931], // La Guaira
}: {
  defaultCenter?: [number, number];
}) {
  const [pos, setPos] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function useMyLocation() {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("Tu dispositivo no permite ubicación.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos([p.coords.latitude, p.coords.longitude]);
        setLocating(false);
      },
      () => {
        setError("No se pudo obtener tu ubicación. Márcala tocando el mapa.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
          <MapPin className="h-3.5 w-3.5" />
          {pos
            ? `Marcado: ${pos[0].toFixed(5)}, ${pos[1].toFixed(5)}`
            : "Toca el mapa para marcar el lugar exacto (opcional)"}
        </span>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
        >
          {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />}
          Usar mi ubicación
        </button>
      </div>

      <PickerMap value={pos} center={defaultCenter} onChange={(lat, lng) => setPos([lat, lng])} />

      {error && <p className="text-xs text-rose-600">{error}</p>}
      {pos && (
        <button
          type="button"
          onClick={() => setPos(null)}
          className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:underline"
        >
          <X className="h-3 w-3" />
          Quitar marca
        </button>
      )}

      <input type="hidden" name="lat" value={pos?.[0] ?? ""} readOnly />
      <input type="hidden" name="lng" value={pos?.[1] ?? ""} readOnly />
    </div>
  );
}
