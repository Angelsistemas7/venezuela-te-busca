import Link from "next/link";
import { MapPinned } from "lucide-react";
import { getMarches } from "@/lib/data";
import { cn } from "@/lib/utils";
import { MarchCard } from "@/components/MarchCard";
import { RegisterMarchButton } from "@/components/RegisterMarchButton";
import { CommunityTabs } from "@/components/CommunityTabs";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const SHOWS = ["all", "upcoming", "past"] as const;
type Show = (typeof SHOWS)[number];

export default async function CaravanasPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const raw = str(sp.show);
  const show: Show = SHOWS.includes(raw as Show) ? (raw as Show) : "all";

  const marches = await getMarches();
  const now = Date.now();
  const upcoming = marches.filter((m) => new Date(m.departAt).getTime() >= now);
  const past = marches.filter((m) => new Date(m.departAt).getTime() < now);

  const showUpcoming = show === "all" || show === "upcoming";
  const showPast = show === "all" || show === "past";

  const CHIPS: { value: Show; label: string }[] = [
    { value: "all", label: "Todas" },
    { value: "upcoming", label: `Próximas (${upcoming.length})` },
    { value: "past", label: `Finalizadas (${past.length})` },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <CommunityTabs />
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
        <>
          <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
            {CHIPS.map((c) => (
              <Link
                key={c.value}
                href={c.value === "all" ? "/caravanas" : `/caravanas?show=${c.value}`}
                className={cn(
                  "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                  show === c.value
                    ? "border-brand-400 bg-brand-50 text-brand-700"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300",
                )}
              >
                {c.label}
              </Link>
            ))}
          </div>

          <div className="space-y-8">
            {showUpcoming && upcoming.length > 0 && (
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

            {showPast && past.length > 0 && (
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

            {((show === "upcoming" && upcoming.length === 0) ||
              (show === "past" && past.length === 0)) && (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center text-zinc-500">
                No hay caravanas en esta vista.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
