"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { MiniPoint, MiniZone } from "./MiniMapView";

// Leaflet usa `window`, por eso se carga solo en el cliente (igual que CrisisMap).
const MiniMapView = dynamic(() => import("./MiniMapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-zinc-100">
      <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
    </div>
  ),
});

export function MiniMap(props: {
  zones: MiniZone[];
  aidPoints: MiniPoint[];
  hospitals: MiniPoint[];
  center: [number, number];
  zoom?: number;
}) {
  return <MiniMapView {...props} />;
}
