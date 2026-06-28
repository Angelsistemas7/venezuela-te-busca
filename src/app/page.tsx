import {
  getDashboardStats,
  getPersonGroups,
  getPersons,
  getRecentlyLocated,
  type GroupBy,
  type PersonSort,
} from "@/lib/data";
import type { PersonStatus } from "@/lib/types";
import { DashboardStats } from "@/components/DashboardStats";
import { RecentlyLocated } from "@/components/RecentlyLocated";
import { SearchAndFilters } from "@/components/SearchAndFilters";
import { PersonViewToggle } from "@/components/PersonViewToggle";
import { PersonGrid } from "@/components/PersonGrid";
import { PersonGroups } from "@/components/PersonGroups";
import { Pagination } from "@/components/Pagination";
import { RegisterPersonButton } from "@/components/RegisterPersonButton";
import { DevModeNotice } from "@/components/DevModeNotice";
import { FeaturedSections } from "@/components/FeaturedSections";
import { EstadoChips } from "@/components/EstadoChips";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
function num(v: string | string[] | undefined): number | undefined {
  const s = str(v);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;

  // Las secciones destacadas solo se muestran en la vista "limpia" (sin
  // búsqueda ni filtros activos), para no estorbar cuando se está filtrando.
  const hasActiveQuery = ["q", "status", "estado", "gender", "minAge", "maxAge", "page"].some(
    (k) => str(sp[k]),
  );

  // Interruptor de la portada: "Se busca" (gente con datos) o "¿La reconoces?"
  // (gente vista, sin identificar). Cambia qué personas se listan.
  const view = str(sp.view) === "reconoces" ? "reconoces" : "busca";
  const isReconoces = view === "reconoces";

  const status = (str(sp.status) as PersonStatus | "all") ?? "all";

  // Al filtrar por estado de localización agrupamos los resultados (solo en "Se
  // busca"): Hospitalizado → por hospital; Localizado / Confirmado sin vida →
  // por región. En "¿La reconoces?" no se agrupa.
  const groupBy: GroupBy | null = isReconoces
    ? null
    : status === "hospitalizado"
      ? "hospital"
      : status === "localizado" || status === "fallecido"
        ? "estado"
        : null;

  const baseQuery = {
    ...(isReconoces ? { unidentifiedOnly: true } : { excludeUnidentified: true }),
    search: str(sp.q),
    status,
    estado: str(sp.estado) ?? "all",
    gender: str(sp.gender) ?? "all",
    minAge: num(sp.minAge),
    maxAge: num(sp.maxAge),
    sort: (str(sp.sort) as PersonSort) ?? "recent",
  };

  // Las secciones extra (localizados, chips, destacados) son propias de "Se
  // busca" y solo en la vista limpia.
  const showExtras = !isReconoces && !hasActiveQuery;

  const [stats, result, groups, recentlyLocated] = await Promise.all([
    getDashboardStats(),
    groupBy ? Promise.resolve(null) : getPersons({ ...baseQuery, page: num(sp.page) ?? 1, pageSize: 24 }),
    groupBy ? getPersonGroups(baseQuery, groupBy) : Promise.resolve(null),
    showExtras ? getRecentlyLocated(12) : Promise.resolve([]),
  ]);

  const total = groupBy
    ? (groups ?? []).reduce((n, g) => n + g.items.length, 0)
    : (result?.total ?? 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <DevModeNotice />

      <div className="mb-5 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          {isReconoces ? "¿La reconoces?" : "Se busca: personas desaparecidas"}
        </h1>
        <p className="text-zinc-500">
          {isReconoces ? (
            <>
              Personas que <strong>alguien vio o encontró</strong> —en un hospital, refugio o la
              calle— y de las que <strong>no se sabe quiénes son</strong>. Si reconoces a alguien,
              entra y avisa. Búscalas por <strong>foto, rasgos, ropa y lugar</strong>.
            </>
          ) : (
            <>
              Personas de las que <strong>se tiene información</strong> (nombre, cédula o datos) y se
              busca saber <strong>dónde están</strong>. ¿Las viste? Entra en su ficha y avisa.
            </>
          )}
        </p>
      </div>

      <div className="mb-6">
        <PersonViewToggle view={view} />
      </div>

      <DashboardStats stats={stats} />

      {showExtras && (
        <p className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-sky-800">
          🔎 <strong>Asistente:</strong> escribe el nombre de quien buscas en el buscador y te decimos
          si aparece <strong>desaparecido</strong>, <strong>en un hospital</strong> o{" "}
          <strong>a salvo</strong>.
        </p>
      )}

      <div className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <SearchAndFilters unidentified={isReconoces} />
          </div>
          <div className="shrink-0">
            <RegisterPersonButton />
          </div>
        </div>

        {showExtras && (
          <div className="space-y-8 border-t border-zinc-100 pt-6">
            <RecentlyLocated persons={recentlyLocated} />
            <EstadoChips />
            <FeaturedSections />
          </div>
        )}

        <div className="border-t border-zinc-100 pt-6">
          <h2 className="mb-3 font-bold text-zinc-900">
            {hasActiveQuery
              ? "Resultados"
              : isReconoces
                ? "Personas sin identificar"
                : "Todos los registros"}
          </h2>
          <p className="mb-4 text-sm text-zinc-500">
            {total.toLocaleString("es-VE")}{" "}
            {isReconoces
              ? total === 1
                ? "caso sin identificar"
                : "casos sin identificar"
              : total === 1
                ? "persona encontrada"
                : "personas encontradas"}
            {groupBy && (
              <span className="text-zinc-400">
                {" · "}agrupadas por {groupBy === "hospital" ? "hospital" : "región"}
              </span>
            )}
          </p>

          {groupBy ? (
            <PersonGroups groups={groups ?? []} groupKind={groupBy} />
          ) : (
            <>
              <PersonGrid persons={result?.items ?? []} />
              <div className="mt-6">
                <Pagination
                  page={result?.page ?? 1}
                  pageSize={result?.pageSize ?? 24}
                  total={result?.total ?? 0}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
