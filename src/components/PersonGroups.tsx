import { Building2, MapPin } from "lucide-react";
import type { PersonGroup } from "@/lib/data";
import { PersonGrid } from "./PersonGrid";

// Lista de personas agrupada en secciones con encabezado (hospital o región).
// Se usa al filtrar por estado de localización; cada grupo reutiliza PersonGrid.
export function PersonGroups({
  groups,
  groupKind,
}: {
  groups: PersonGroup[];
  groupKind: "hospital" | "estado";
}) {
  if (groups.length === 0) {
    return <PersonGrid persons={[]} />;
  }

  const Icon = groupKind === "hospital" ? Building2 : MapPin;

  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <section key={g.key}>
          <div className="mb-3 flex items-center gap-2 border-b border-zinc-100 pb-2">
            <Icon className="h-4 w-4 shrink-0 text-zinc-400" />
            <h3 className="font-semibold text-zinc-900">{g.label}</h3>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
              {g.items.length}
            </span>
          </div>
          <PersonGrid persons={g.items} />
        </section>
      ))}
    </div>
  );
}
