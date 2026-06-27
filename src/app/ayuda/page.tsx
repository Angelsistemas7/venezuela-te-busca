import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { getAidPoints } from "@/lib/data";
import { AID_POINT_TYPE_LABEL, type AidPointType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AidPointCard } from "@/components/AidPointCard";
import { RegisterAidPointButton } from "@/components/RegisterAidPointButton";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const TYPE_EMOJI: Record<AidPointType, string> = {
  comida: "🍲",
  agua: "💧",
  medicina: "💊",
  refugio: "🏠",
  ropa: "👕",
  otro: "📦",
};

const TYPE_CHIPS: { value: AidPointType | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  ...(Object.keys(AID_POINT_TYPE_LABEL) as AidPointType[]).map((t) => ({
    value: t,
    label: `${TYPE_EMOJI[t]} ${AID_POINT_TYPE_LABEL[t]}`,
  })),
];

export default async function AyudaPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const type = (str(sp.type) as AidPointType | "all") ?? "all";
  const availOnly = str(sp.avail) === "1";

  const all = await getAidPoints();
  let points = type === "all" ? all : all.filter((p) => p.types.includes(type));
  if (availOnly) points = points.filter((p) => p.available);
  // Disponibles primero (la recencia se mantiene dentro de cada grupo).
  points = [...points.filter((p) => p.available), ...points.filter((p) => !p.available)];

  const chipHref = (t: AidPointType | "all") => {
    const params = new URLSearchParams();
    if (t !== "all") params.set("type", t);
    if (availOnly) params.set("avail", "1");
    const qs = params.toString();
    return qs ? `/ayuda?${qs}` : "/ayuda";
  };
  const availHref = () => {
    const params = new URLSearchParams();
    if (type !== "all") params.set("type", type);
    if (!availOnly) params.set("avail", "1");
    const qs = params.toString();
    return qs ? `/ayuda?${qs}` : "/ayuda";
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-400 text-zinc-900">
            <HeartHandshake className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Puntos de ayuda
            </h1>
            <p className="mt-1 max-w-2xl text-zinc-500">
              Donatones de comida, agua, refugios y medicinas. Registra un punto físico real con foto
              y datos de contacto para que la comunidad lo verifique y la ayuda llegue a donde se
              necesita.
            </p>
          </div>
        </div>
        <RegisterAidPointButton />
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {TYPE_CHIPS.map((c) => (
            <Link
              key={c.value}
              href={chipHref(c.value)}
              className={cn(
                "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                type === c.value
                  ? "border-brand-400 bg-brand-50 text-brand-700"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300",
              )}
            >
              {c.label}
            </Link>
          ))}
        </div>
        <Link
          href={availHref()}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
            availOnly
              ? "border-emerald-400 bg-emerald-50 text-emerald-700"
              : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300",
          )}
        >
          {availOnly ? "✓ " : ""}Solo disponibles
        </Link>
      </div>

      {points.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center text-zinc-500">
          {all.length === 0
            ? "Aún no hay puntos registrados. Sé el primero en publicar uno."
            : "Ningún punto coincide con el filtro. Prueba con otro recurso o quita “solo disponibles”."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {points.map((point) => (
            <AidPointCard key={point.id} point={point} />
          ))}
        </div>
      )}
    </div>
  );
}
