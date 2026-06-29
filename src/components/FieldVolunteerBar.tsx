"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HandHeart, X } from "lucide-react";

// Barra de reclutamiento de voluntarios en el terreno. Cerrable por dispositivo
// (localStorage). Anima su entrada; cero costo de servidor.
export function FieldVolunteerBar() {
  // Empieza oculta para no parpadear antes de leer localStorage.
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setHidden(localStorage.getItem("vtb_hide_fieldvol") === "1");
  }, []);

  if (hidden) return null;

  return (
    <div className="animate-rise mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-3 sm:p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
        <HandHeart className="h-5 w-5" />
      </span>
      <p className="flex-1 text-sm text-zinc-700">
        <strong className="text-zinc-900">¿Estás en la zona del terremoto?</strong> Ayúdanos
        reportando el estado de <strong>hospitales y refugios</strong>, o súmate como voluntario.
      </p>
      <Link
        href="/voluntarios"
        className="press shrink-0 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        Quiero ayudar
      </Link>
      <button
        onClick={() => {
          localStorage.setItem("vtb_hide_fieldvol", "1");
          setHidden(true);
        }}
        aria-label="Cerrar aviso"
        className="press shrink-0 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
