"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ESTADOS, PERSON_STATUS_LABEL, type PersonStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Select } from "./FormControls";

const STATUS_CHIPS: { value: PersonStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "por_localizar", label: PERSON_STATUS_LABEL.por_localizar },
  { value: "localizado", label: PERSON_STATUS_LABEL.localizado },
  { value: "hospitalizado", label: PERSON_STATUS_LABEL.hospitalizado },
  { value: "fallecido", label: PERSON_STATUS_LABEL.fallecido },
];

export function SearchAndFilters({ unidentified = false }: { unidentified?: boolean } = {}) {
  // En "¿La reconoces?" la persona ya fue vista/ubicada: "Por localizar" no aplica.
  const statusChips = unidentified
    ? STATUS_CHIPS.filter((c) => c.value !== "por_localizar")
    : STATUS_CHIPS;

  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(false);
  const [searchValue, setSearchValue] = useState(params.get("q") ?? "");

  const status = params.get("status") ?? "all";
  const estado = params.get("estado") ?? "all";
  const gender = params.get("gender") ?? "all";
  const sort = params.get("sort") ?? "recent";
  const minAge = params.get("minAge") ?? "";
  const maxAge = params.get("maxAge") ?? "";

  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "" || value === "all") next.delete(key);
        else next.set(key, value);
      }
      next.delete("page"); // cualquier cambio de filtro vuelve a la página 1
      startTransition(() => {
        router.push(`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [params, pathname, router],
  );

  // Búsqueda con "debounce" para no consultar en cada tecla.
  useEffect(() => {
    const current = params.get("q") ?? "";
    if (searchValue === current) return;
    const t = setTimeout(() => setParams({ q: searchValue }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  const activeFilterCount = [
    estado !== "all",
    gender !== "all",
    minAge !== "",
    maxAge !== "",
    sort !== "recent",
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Buscar nombre, cédula o ubicación"
            className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-9 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          {searchValue && (
            <button
              onClick={() => setSearchValue("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "flex items-center gap-2 rounded-xl border px-4 text-sm font-medium transition",
            showFilters || activeFilterCount > 0
              ? "border-zinc-900 bg-zinc-900 text-white"
              : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50",
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filtros</span>
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-400 text-xs font-bold text-zinc-900">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Chips rápidos por estado de localización */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
        {statusChips.map((chip) => (
          <button
            key={chip.value}
            onClick={() => setParams({ status: chip.value })}
            className={cn(
              "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
              status === chip.value
                ? "border-brand-400 bg-brand-50 text-brand-700"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Panel de filtros avanzados */}
      {showFilters && (
        <div className="animate-fade-in grid grid-cols-1 gap-4 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Estado (región)</label>
            <Select value={estado} onChange={(e) => setParams({ estado: e.target.value })}>
              <option value="all">Todos</option>
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Género</label>
            <Select value={gender} onChange={(e) => setParams({ gender: e.target.value })}>
              <option value="all">Todos</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Edad</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={120}
                placeholder="Mín."
                defaultValue={minAge}
                onBlur={(e) => setParams({ minAge: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 px-2 py-2 text-sm outline-none focus:border-brand-400"
              />
              <span className="text-zinc-400">–</span>
              <input
                type="number"
                min={0}
                max={120}
                placeholder="Máx."
                defaultValue={maxAge}
                onBlur={(e) => setParams({ maxAge: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 px-2 py-2 text-sm outline-none focus:border-brand-400"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Ordenar por</label>
            <Select value={sort} onChange={(e) => setParams({ sort: e.target.value })}>
              <option value="recent">Más recientes</option>
              <option value="name">Nombre (A–Z)</option>
              <option value="estado">Estado (región)</option>
            </Select>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={() =>
                setParams({ estado: null, gender: null, minAge: null, maxAge: null, sort: null })
              }
              className="text-sm font-medium text-rose-600 hover:underline sm:col-span-2 lg:col-span-4"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {isPending && <p className="text-xs text-zinc-400">Actualizando resultados…</p>}
    </div>
  );
}
