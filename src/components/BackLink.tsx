"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// "Volver al listado" usando el HISTORIAL del navegador, no un enlace fijo:
// si venías de un listado filtrado/paginado (p. ej. "Ver todos" de un grupo de
// edad, o una página 3), esto te regresa exactamente ahí en vez de reiniciar
// al inicio. Si no hay historial propio (llegaste por un enlace directo),
// cae al `fallbackHref`.
export function BackLink({ label, fallbackHref }: { label: string; fallbackHref: string }) {
  const router = useRouter();

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push(fallbackHref);
  }

  return (
    <button
      onClick={goBack}
      className="press mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}
