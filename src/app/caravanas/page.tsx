import Link from "next/link";
import { MapPinned } from "lucide-react";
import { getMarchesPage } from "@/lib/data";
import { cn, clampPageSize } from "@/lib/utils";
import { MarchCard } from "@/components/MarchCard";
import { RegisterMarchButton } from "@/components/RegisterMarchButton";
import { CommunityTabs } from "@/components/CommunityTabs";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { PageSizeSelect } from "@/components/PageSizeSelect";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v: string | string[] | undefined) => {
  const s = str(v);
  const n = s ? Number(s) : NaN;
  return Number.isFinite(n) ? n : undefined;
};

const SHOWS = ["all", "upcoming", "past"] as const;
type Show = (typeof SHOWS)[number];

export default async function CaravanasPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const raw = str(sp.show);
  const show: Show = SHOWS.includes(raw as Show) ? (raw as Show) : "all";
  const page = num(sp.page) ?? 1;
  const pageSize = clampPageSize(num(sp.pageSize));

  const { items: marches, total, upcomingCount, pastCount } = await getMarchesPage(show, page, pageSize);

  const showHref = (s: Show) => {
    const params = new URLSearchParams();
    if (s !== "all") params.set("show", s);
    if (pageSize !== 10) params.set("pageSize", String(pageSize));
    const qs = params.toString();
    return qs ? `/caravanas?${qs}` : "/caravanas";
  };

  const CHIPS: { value: Show; label: string }[] = [
    { value: "all", label: `Todas (${upcomingCount + pastCount})` },
    { value: "upcoming", label: `Próximas (${upcomingCount})` },
    { value: "past", label: `Finalizadas (${pastCount})` },
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

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {CHIPS.map((c) => (
            <Link
              key={c.value}
              href={showHref(c.value)}
              className={cn(
                "press whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                show === c.value
                  ? "border-brand-400 bg-brand-50 text-brand-700"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300",
              )}
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-4 flex justify-end">
        <PageSizeSelect value={pageSize} />
      </div>

      {marches.length === 0 ? (
        <EmptyState
          icon={MapPinned}
          title={total === 0 ? "Aún no hay caravanas" : "No hay caravanas en esta vista"}
          description="Organiza una ida en grupo a la zona afectada: publica el punto de salida y la hora."
        />
      ) : (
        <>
          <div className="animate-rise grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {marches.map((m) => (
              <MarchCard key={m.id} march={m} />
            ))}
          </div>
          <div className="mt-6">
            <Pagination page={page} pageSize={pageSize} total={total} />
          </div>
        </>
      )}
    </div>
  );
}
