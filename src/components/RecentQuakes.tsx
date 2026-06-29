import { Activity, ExternalLink } from "lucide-react";
import type { Quake } from "@/lib/usgs";
import { QUAKE_INFO } from "@/lib/geo";
import { timeAgo } from "@/lib/utils";

function magTone(mag: number): string {
  if (mag >= 6) return "bg-rose-100 text-rose-700";
  if (mag >= 5) return "bg-orange-100 text-orange-700";
  if (mag >= 4) return "bg-amber-100 text-amber-700";
  return "bg-zinc-100 text-zinc-600";
}

// Réplicas y sismos recientes alrededor de Venezuela (datos reales del USGS).
export function RecentQuakes({ quakes }: { quakes: Quake[] }) {
  return (
    <div className="space-y-4">
    {/* Cifras del sismo (fuentes públicas, preliminar) */}
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
      <span className="font-semibold text-zinc-700">Cifras del sismo (preliminar):</span>
      <span>
        Magnitud <strong>M {QUAKE_INFO.magnitude}</strong>
      </span>
      <span>
        Heridos <strong>+{QUAKE_INFO.injured.toLocaleString("es-VE")}</strong>
      </span>
      <span>
        Fallecidos <strong>{QUAKE_INFO.deaths.toLocaleString("es-VE")}</strong>
      </span>
      <span className="text-xs text-zinc-400">Fuentes: {QUAKE_INFO.sourceName}</span>
    </div>

    <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-bold text-zinc-900">
          <Activity className="h-5 w-5 text-rose-500" />
          Réplicas y sismos recientes
        </h2>
        <span className="text-xs text-zinc-400">Fuente: USGS</span>
      </div>
      <p className="mt-1 text-sm text-zinc-500">
        Actividad sísmica real de los últimos días alrededor de Venezuela. Los sismos no se pueden
        predecir; esto solo informa.
      </p>

      {quakes.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-6 text-center text-sm text-zinc-500">
          No hay datos del USGS disponibles ahora mismo. Intenta de nuevo más tarde.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-zinc-100">
          {quakes.map((q) => (
            <li key={q.id} className="flex items-center gap-3 py-2.5">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold tabular-nums ${magTone(q.mag)}`}
              >
                {q.mag.toFixed(1)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-800">{q.place}</p>
                <p className="text-xs text-zinc-400">{timeAgo(new Date(q.time).toISOString())}</p>
              </div>
              {q.url && (
                <a
                  href={q.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-zinc-400 hover:text-zinc-700"
                  aria-label="Ver en USGS"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
    </div>
  );
}
