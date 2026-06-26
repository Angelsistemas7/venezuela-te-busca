import { HeartHandshake } from "lucide-react";
import { getAidPoints } from "@/lib/data";
import { AidPointCard } from "@/components/AidPointCard";
import { RegisterAidPointButton } from "@/components/RegisterAidPointButton";

export const dynamic = "force-dynamic";

export default async function AyudaPage() {
  const points = await getAidPoints();

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

      {points.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center text-zinc-500">
          Aún no hay puntos registrados. Sé el primero en publicar uno.
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
