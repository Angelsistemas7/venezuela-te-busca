import { Wrench } from "lucide-react";
import { NATIONAL_LINE } from "@/lib/emergency";

// Página que muestra `middleware.ts` cuando MAINTENANCE_MODE=true, para
// cualquier visitante que no tenga la cookie de admin. No consulta nada.

export const metadata = {
  title: "Sitio en mantenimiento",
  description: "El Mundo Te Busca está en mantenimiento temporal.",
};

export default function MantenimientoPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
        <Wrench className="h-7 w-7" />
      </span>
      <h1 className="mt-5 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
        Sitio en mantenimiento
      </h1>
      <p className="mt-3 text-zinc-600">
        Estamos haciendo mejoras en la plataforma. Volvemos a estar disponibles en breve — gracias
        por tu paciencia.
      </p>
      <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-zinc-700">
        Si tienes una emergencia, llama al{" "}
        <a href={`tel:${NATIONAL_LINE.number}`} className="font-bold text-rose-700 underline">
          {NATIONAL_LINE.number}
        </a>
        .
      </p>
    </div>
  );
}
