import Link from "next/link";
import { PawPrint, Search } from "lucide-react";
import { getCommentsForEntities, getPets } from "@/lib/data";
import { PET_STATUS_EMOJI, PET_STATUS_LABEL, type PetStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PetCard } from "@/components/PetCard";
import { RegisterPetButton } from "@/components/RegisterPetButton";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const FILTERS: { value: PetStatus | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  ...(Object.keys(PET_STATUS_LABEL) as PetStatus[]).map((s) => ({
    value: s,
    label: `${PET_STATUS_EMOJI[s]} ${PET_STATUS_LABEL[s]}`,
  })),
];

export default async function MascotasPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const status = (str(sp.status) as PetStatus | "all") ?? "all";
  const q = str(sp.q);

  const pets = await getPets({ status, search: q });
  const commentsByPet = await getCommentsForEntities("pet", pets.map((p) => p.id));

  const statusHref = (s: PetStatus | "all") => {
    const params = new URLSearchParams();
    if (s !== "all") params.set("status", s);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/mascotas?${qs}` : "/mascotas";
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-400 text-zinc-900">
            <PawPrint className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Mascotas</h1>
            <p className="mt-1 text-zinc-500">
              ¿Perdiste o encontraste una mascota tras el terremoto? Repórtala con foto y ubicación
              para reunirla con su familia.
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <RegisterPetButton />
        </div>
      </div>

      <form action="/mascotas" className="mb-3 flex gap-2">
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nombre, ciudad o zona..."
            className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <button type="submit" className="rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800">
          Buscar
        </button>
      </form>

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={statusHref(f.value)}
            className={cn(
              "whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition",
              status === f.value
                ? "border-brand-400 bg-brand-50 text-brand-700"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {pets.length === 0 ? (
        <EmptyState
          icon={PawPrint}
          title="No hay mascotas reportadas aquí"
          description="¿Perdiste o encontraste una mascota tras el sismo? Repórtala para reunirla con su familia."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pets.map((p) => (
            <PetCard key={p.id} pet={p} comments={commentsByPet[p.id] ?? []} />
          ))}
        </div>
      )}
    </div>
  );
}
