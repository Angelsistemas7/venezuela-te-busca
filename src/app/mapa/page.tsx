import Link from "next/link";
import { Map as MapIcon, Siren } from "lucide-react";
import { getAidPoints, getEstadoBreakdown, getHospitals, getMarches, getPosts } from "@/lib/data";
import {
  AID_POINT_TYPE_LABEL,
  HOSPITAL_STATUS_LABEL,
  type AidPointType,
  type HospitalStatus,
} from "@/lib/types";
import { EPICENTER, ESTADO_COORDS, QUAKE_INFO, geocode } from "@/lib/geo";
import { formatDateTime, timeAgo } from "@/lib/utils";
import { CrisisMap } from "@/components/map/CrisisMap";
import type {
  AidMarker,
  HospitalMarker,
  MarchMarker,
  RescueMarker,
  Zone,
} from "@/components/map/MapView";

export const dynamic = "force-dynamic";

const TYPE_EMOJI: Record<AidPointType, string> = {
  comida: "🍲",
  agua: "💧",
  medicina: "💊",
  refugio: "🏠",
  alojamiento: "🛏️",
  ropa: "👕",
  otro: "📦",
};

const HOSPITAL_COLOR: Record<HospitalStatus, string> = {
  operativo: "#10b981",
  saturado: "#f59e0b",
  lleno: "#ef4444",
  cerrado: "#a1a1aa",
};

export default async function MapaPage() {
  const [breakdown, aid, marches, hospitals, rescuePosts] = await Promise.all([
    getEstadoBreakdown(),
    getAidPoints(),
    getMarches(),
    getHospitals(),
    getPosts({ type: "rescate" }),
  ]);

  const zones: Zone[] = Object.entries(breakdown)
    .filter(([estado]) => ESTADO_COORDS[estado])
    .map(([estado, b]) => {
      const [lat, lng] = ESTADO_COORDS[estado];
      return {
        key: estado,
        name: estado,
        lat,
        lng,
        count: b.total,
        toLocate: b.toLocate,
        located: b.located,
        deceased: b.deceased,
      };
    });

  const aidPoints: AidMarker[] = aid
    .filter((p) => p.available) // no enviar gente a puntos agotados
    .map((p) => {
      const coord = geocode(p.locationText, p.estado, p.id);
      if (!coord) return null;
      return {
        id: p.id,
        name: p.name,
        typeLabel: p.types.map((t) => AID_POINT_TYPE_LABEL[t]).join(", ") || "Ayuda",
        emoji: p.types[0] ? TYPE_EMOJI[p.types[0]] : "📦",
        lat: coord[0],
        lng: coord[1],
        verified: p.verified,
        href: `/ayuda/${p.id}`,
      } satisfies AidMarker;
    })
    .filter((x): x is AidMarker => x !== null);

  const marchMarkers: MarchMarker[] = marches
    .map((m) => {
      const coord = geocode(m.originText, null, m.id);
      if (!coord) return null;
      return {
        id: m.id,
        title: m.title,
        lat: coord[0],
        lng: coord[1],
        when: formatDateTime(m.departAt),
        href: `/caravanas/${m.id}`,
      } satisfies MarchMarker;
    })
    .filter((x): x is MarchMarker => x !== null);

  const hospitalMarkers: HospitalMarker[] = hospitals
    .map((h) => {
      const coord = geocode(h.locationText, h.estado, h.id);
      if (!coord) return null;
      return {
        id: h.id,
        name: h.name,
        statusLabel: HOSPITAL_STATUS_LABEL[h.status],
        color: HOSPITAL_COLOR[h.status],
        lat: coord[0],
        lng: coord[1],
        href: `/hospitales/${h.id}`,
      } satisfies HospitalMarker;
    })
    .filter((x): x is HospitalMarker => x !== null);

  const rescues: RescueMarker[] = rescuePosts
    .map((p) => {
      const coord = geocode(p.locationText, p.estado, p.id);
      if (!coord) return null;
      return {
        id: p.id,
        body: p.body,
        locationText: p.locationText,
        lat: coord[0],
        lng: coord[1],
        when: formatDateTime(p.createdAt),
        href: "/comunidad?type=rescate",
      } satisfies RescueMarker;
    })
    .filter((x): x is RescueMarker => x !== null);

  const totalInZones = zones.reduce((s, z) => s + z.count, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
          <MapIcon className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Mapa de la emergencia
          </h1>
          <p className="mt-1 max-w-2xl text-zinc-500">
            Zonas afectadas, puntos de ayuda y salidas de caravanas benéficas en un solo lugar. Pasa
            el cursor (o toca) una zona para ver cuántas personas hay registradas allí.
          </p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center">
          <div className="text-xl font-bold text-rose-700">{totalInZones.toLocaleString("es-VE")}</div>
          <div className="text-xs text-zinc-600">En zonas con registro</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
          <div className="text-xl font-bold text-amber-700">{aidPoints.length}</div>
          <div className="text-xs text-zinc-600">Puntos de ayuda</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
          <div className="text-xl font-bold text-emerald-700">{hospitalMarkers.length}</div>
          <div className="text-xs text-zinc-600">Hospitales</div>
        </div>
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-center">
          <div className="text-xl font-bold text-sky-700">{marchMarkers.length}</div>
          <div className="text-xs text-zinc-600">Caravanas</div>
        </div>
      </div>

      {rescuePosts.length > 0 && (
        <div className="mb-4 rounded-2xl border border-red-300 bg-red-50 p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-red-800">
            <Siren className="h-4.5 w-4.5 animate-pulse" />
            Alertas de rescate activas ({rescuePosts.length})
          </h2>
          <ul className="mt-3 space-y-2">
            {rescuePosts.slice(0, 4).map((p) => (
              <li key={p.id} className="rounded-xl border border-red-200 bg-white p-3">
                <div className="flex flex-wrap items-center gap-2">
                  {p.locationText && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                      📍 {p.locationText}
                    </span>
                  )}
                  <span className="text-xs text-zinc-400">{timeAgo(p.createdAt)}</span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm text-zinc-700">{p.body}</p>
              </li>
            ))}
          </ul>
          <Link
            href="/comunidad?type=rescate"
            className="mt-3 inline-block text-sm font-semibold text-red-700 hover:underline"
          >
            Ver todas las alertas de rescate →
          </Link>
        </div>
      )}

      <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-bold text-zinc-900">Datos del sismo (fuentes públicas)</h2>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-zinc-600 sm:grid-cols-4">
          <div>
            <span className="block text-xs text-zinc-400">Magnitud</span>M {QUAKE_INFO.magnitude}
          </div>
          <div>
            <span className="block text-xs text-zinc-400">Profundidad</span>{QUAKE_INFO.depthKm} km
          </div>
          <div>
            <span className="block text-xs text-zinc-400">Fallecidos</span>{QUAKE_INFO.deaths}
          </div>
          <div>
            <span className="block text-xs text-zinc-400">Heridos</span>+{QUAKE_INFO.injured.toLocaleString("es-VE")}
          </div>
        </div>
        <p className="mt-2 text-sm text-zinc-600">
          <span className="text-xs text-zinc-400">Epicentro: </span>
          {QUAKE_INFO.epicenterText} · <span className="text-xs text-zinc-400">Más afectada: </span>
          {QUAKE_INFO.mostAffected}.
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          También afectados: {QUAKE_INFO.alsoAffected.join(", ")}. Fuentes: {QUAKE_INFO.sourceName}.
        </p>
      </div>

      <CrisisMap
        zones={zones}
        aidPoints={aidPoints}
        marches={marchMarkers}
        hospitals={hospitalMarkers}
        rescues={rescues}
        epicenter={EPICENTER}
        center={[10.52, -67.7]}
        zoom={8}
      />
    </div>
  );
}
