import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Insignia + título + descripción: el trío que se repite igual en el
// encabezado de cada página del sitio. Reemplaza SOLO ese trío — el <div>
// exterior de cada página (a veces con un botón de registro al lado, o una
// ilustración) se queda como está, esto no intenta absorber esa variedad.
const TONE = {
  brand: "bg-brand-400 text-zinc-900",
  rose: "bg-rose-600 text-white",
  emerald: "bg-emerald-600 text-white",
} as const;

export function PageHeader({
  icon: Icon,
  tone = "brand",
  title,
  description,
}: {
  icon: LucideIcon;
  tone?: keyof typeof TONE;
  title: React.ReactNode;
  description: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          TONE[tone],
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-700 sm:text-3xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-zinc-500">{description}</p>
      </div>
    </div>
  );
}
