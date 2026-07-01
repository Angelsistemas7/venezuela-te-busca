import { SearchX } from "lucide-react";
import type { Person } from "@/lib/types";
import { PersonCard } from "./PersonCard";

export function PersonGrid({ persons }: { persons: Person[] }) {
  if (persons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center">
        <SearchX className="h-10 w-10 text-zinc-300" />
        <p className="mt-3 font-medium text-zinc-700">No hay coincidencias</p>
        <p className="mt-1 max-w-sm text-sm text-zinc-500">
          Prueba con otro nombre, cédula o ubicación, o ajusta los filtros.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-rise grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {persons.map((person) => (
        <PersonCard key={person.id} person={person} />
      ))}
    </div>
  );
}
