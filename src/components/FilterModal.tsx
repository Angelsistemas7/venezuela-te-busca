"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ListFilter } from "lucide-react";
import { Modal } from "./Modal";
import { cn } from "@/lib/utils";

export type FilterOption = { value: string; label: string };

export type FilterField =
  | { kind: "chips"; key: string; label: string; options: FilterOption[]; defaultValue?: string }
  | { kind: "select"; key: string; label: string; options: FilterOption[]; placeholder?: string; defaultValue?: string }
  | { kind: "dateRange"; fromKey: string; toKey: string; label: string }
  | { kind: "numberRange"; fromKey: string; toKey: string; label: string; min?: number; max?: number };

// Ventana de filtros reutilizable: mismo diseño en toda la app (Comunidad,
// Se busca, Voluntarios, Caravanas...), pero cada página decide qué campos
// expone según sus propios datos. Los chips de tipo/categoría que ya existen
// y funcionan bien en cada sección (Todo/Necesito/Ofrezco, etc.) se quedan
// donde están, sueltos y de un toque — este modal es para lo que no cabía
// bien ahí: orden, rango de fechas, filtro por estado/región.
export function FilterModal({
  basePath,
  currentParams,
  fields,
  triggerLabel = "Filtros",
}: {
  basePath: string;
  currentParams: Record<string, string>;
  fields: FilterField[];
  triggerLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>(currentParams);

  const activeCount = useMemo(() => {
    let n = 0;
    for (const f of fields) {
      if (f.kind === "dateRange" || f.kind === "numberRange") {
        if (currentParams[f.fromKey] || currentParams[f.toKey]) n++;
      } else if ((currentParams[f.key] ?? "") !== (f.defaultValue ?? "")) {
        n++;
      }
    }
    return n;
  }, [fields, currentParams]);

  function openModal() {
    setDraft(currentParams);
    setOpen(true);
  }

  function apply() {
    const defaultOf = (key: string) => {
      for (const f of fields) {
        if ((f.kind === "chips" || f.kind === "select") && f.key === key) return f.defaultValue ?? "";
      }
      return "";
    };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(draft)) {
      if (k === "page") continue;
      if (v && v !== defaultOf(k)) params.set(k, v);
    }
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
    setOpen(false);
  }

  function clear() {
    const cleared = { ...draft };
    for (const f of fields) {
      if (f.kind === "dateRange" || f.kind === "numberRange") {
        delete cleared[f.fromKey];
        delete cleared[f.toKey];
      } else {
        delete cleared[f.key];
      }
    }
    setDraft(cleared);
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="press relative inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-white px-3.5 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-400"
      >
        <ListFilter className="h-4 w-4" />
        {triggerLabel}
        {activeCount > 0 && (
          <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-400 px-1 text-xs font-bold text-zinc-900">
            {activeCount}
          </span>
        )}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Filtros"
        subtitle="Ajusta el orden y los filtros; el resto de la búsqueda se mantiene."
        footer={
          <>
            <button
              type="button"
              onClick={clear}
              className="press rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={apply}
              className="press rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Aplicar
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {fields.map((f) => {
            if (f.kind === "dateRange") {
              return (
                <div key={f.fromKey}>
                  <p className="mb-1.5 text-sm font-semibold text-zinc-900">{f.label}</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={draft[f.fromKey] ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, [f.fromKey]: e.target.value }))}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    />
                    <span className="text-sm text-zinc-400">a</span>
                    <input
                      type="date"
                      value={draft[f.toKey] ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, [f.toKey]: e.target.value }))}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                </div>
              );
            }

            if (f.kind === "numberRange") {
              return (
                <div key={f.fromKey}>
                  <p className="mb-1.5 text-sm font-semibold text-zinc-900">{f.label}</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={f.min}
                      max={f.max}
                      placeholder="Mín."
                      value={draft[f.fromKey] ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, [f.fromKey]: e.target.value }))}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    />
                    <span className="text-sm text-zinc-400">–</span>
                    <input
                      type="number"
                      min={f.min}
                      max={f.max}
                      placeholder="Máx."
                      value={draft[f.toKey] ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, [f.toKey]: e.target.value }))}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                </div>
              );
            }

            if (f.kind === "select") {
              return (
                <div key={f.key}>
                  <p className="mb-1.5 text-sm font-semibold text-zinc-900">{f.label}</p>
                  <select
                    value={draft[f.key] ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  >
                    <option value="">{f.placeholder ?? "Todos"}</option>
                    {f.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            return (
              <div key={f.key}>
                <p className="mb-1.5 text-sm font-semibold text-zinc-900">{f.label}</p>
                <div className="flex flex-wrap gap-2">
                  {f.options.map((o) => {
                    const active = (draft[f.key] ?? f.defaultValue ?? "") === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, [f.key]: o.value }))}
                        className={cn(
                          "press rounded-full border px-3 py-1.5 text-sm font-medium transition",
                          active
                            ? "border-brand-400 bg-brand-50 text-brand-700"
                            : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300",
                        )}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
    </>
  );
}
