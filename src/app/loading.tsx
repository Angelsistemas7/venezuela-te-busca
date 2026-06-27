import { Loader2 } from "lucide-react";

// Indicador de carga mientras Next prepara una ruta dinámica (todas hacen
// fetch en el servidor). Evita la sensación de "congelado" en redes lentas.
export default function Loading() {
  return (
    <div className="flex items-center justify-center py-28 text-zinc-400">
      <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
