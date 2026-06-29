import type { LucideIcon } from "lucide-react";

// Estado vacío consistente y amable: un ícono, un título y un texto guía.
// Reemplaza las cajas planas de "Aún no hay…" en todas las secciones.
export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="animate-fade-in flex flex-col items-center rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
        <Icon className="h-7 w-7" />
      </span>
      <p className="mt-4 font-semibold text-zinc-700">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-zinc-500">{description}</p>}
    </div>
  );
}
