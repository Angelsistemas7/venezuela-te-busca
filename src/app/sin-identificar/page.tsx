import { Users } from "lucide-react";
import { getPersons, type PersonSort } from "@/lib/data";
import type { PersonStatus } from "@/lib/types";
import { SearchAndFilters } from "@/components/SearchAndFilters";
import { PersonGrid } from "@/components/PersonGrid";
import { Pagination } from "@/components/Pagination";
import { RegisterPersonButton } from "@/components/RegisterPersonButton";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v: string | string[] | undefined) => {
  const s = str(v);
  const n = s ? Number(s) : NaN;
  return Number.isFinite(n) ? n : undefined;
};

export default async function UnidentifiedPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const result = await getPersons({
    unidentifiedOnly: true,
    search: str(sp.q),
    status: (str(sp.status) as PersonStatus | "all") ?? "all",
    estado: str(sp.estado) ?? "all",
    gender: str(sp.gender) ?? "all",
    minAge: num(sp.minAge),
    maxAge: num(sp.maxAge),
    sort: (str(sp.sort) as PersonSort) ?? "recent",
    page: num(sp.page) ?? 1,
    pageSize: 24,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
          <Users className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            ¿La reconoces?
          </h1>
          <p className="mt-1 max-w-2xl text-zinc-500">
            Personas que <strong>alguien vio o encontró</strong> —en un hospital, refugio o la
            calle— y de las que <strong>no se sabe quiénes son</strong>. Si reconoces a alguien, entra
            y avisa. Búscalas por <strong>foto, rasgos, ropa y lugar</strong>. ¿Buscas a alguien con
            nombre y datos?{" "}
            <a href="/" className="font-medium text-brand-700 hover:underline">
              Ve a “Se busca”
            </a>
            .
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <SearchAndFilters unidentified />
        </div>
        <RegisterPersonButton />
      </div>

      <p className="mb-4 text-sm text-zinc-500">
        {result.total.toLocaleString("es-VE")}{" "}
        {result.total === 1 ? "caso sin identificar" : "casos sin identificar"}
      </p>

      <PersonGrid persons={result.items} />
      <div className="mt-6">
        <Pagination page={result.page} pageSize={result.pageSize} total={result.total} />
      </div>
    </div>
  );
}
