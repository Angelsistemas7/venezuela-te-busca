import { MapPinned } from "lucide-react";
import { getMarches } from "@/lib/data";
import { MarchCard } from "@/components/MarchCard";
import { RegisterMarchButton } from "@/components/RegisterMarchButton";

export const dynamic = "force-dynamic";

export default async function CaravanasPage() {
  const marches = await getMarches();
  const now = Date.now();
  const upcoming = marches.filter((m) => new Date(m.departAt).getTime() >= now);
  const past = marches.filter((m) => new Date(m.departAt).getTime() < now);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
            <MapPinned className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Caravanas benéficas
            </h1>
            <p className="mt-1 max-w-2xl text-zinc-500">
              Coordina idas en grupo a la zona afectada: brigadas, caravanas de ayuda y traslados
              solidarios. Publica el punto de salida y la hora para que la gente vaya junta y segura.
            </p>
          </div>
        </div>
        <RegisterMarchButton />
      </div>

      {marches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center text-zinc-500">
          Aún no hay convocatorias. Sé el primero en organizar una caravana benéfica.
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Próximas ({upcoming.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((m) => (
                  <MarchCard key={m.id} march={m} />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Finalizadas ({past.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 opacity-70 md:grid-cols-2 lg:grid-cols-3">
                {past.map((m) => (
                  <MarchCard key={m.id} march={m} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
