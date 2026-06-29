"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, X } from "lucide-react";

// Barra fija de seguridad para toda la página: protección de la niñez.
// Mensaje siempre visible (se puede ocultar por dispositivo). Es lo más
// importante de recordar en la emergencia, por eso va sobre todo el contenido.
const KEY = "vtb_safety_kids_hidden";

export function SafetyBanner() {
  // Visible por defecto (se renderiza en el servidor); solo se oculta si el
  // usuario ya lo cerró en este dispositivo. Es un mensaje crítico de seguridad.
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Se oculta solo 60 s al cerrarla; reaparece al recargar o re-entrar. Es un
    // mensaje crítico de seguridad: no debe quedar oculto para siempre.
    const ts = Number(localStorage.getItem(KEY) || 0);
    setHidden(Date.now() - ts < 60_000);
  }, []);

  if (hidden) return null;

  return (
    <div className="border-b border-amber-300 bg-amber-100/90 text-amber-900">
      <div className="mx-auto flex max-w-6xl items-start gap-2.5 px-4 py-2">
        <ShieldAlert className="mt-0.5 h-4.5 w-4.5 shrink-0 text-amber-700" />
        <p className="flex-1 text-xs leading-relaxed sm:text-sm">
          <strong>Protege a la niñez:</strong> no dejes a niños y niñas solos ni con personas que no
          conoces, ni siquiera en refugios o colas. Mantenlos con un familiar o adulto de confianza.
          Si ves a un menor solo o algo sospechoso, llama al{" "}
          <a href="tel:911" className="font-bold underline">
            911
          </a>
          .
        </p>
        <button
          onClick={() => {
            localStorage.setItem(KEY, String(Date.now()));
            setHidden(true);
          }}
          aria-label="Ocultar aviso"
          className="-mr-1 rounded p-1 text-amber-700 hover:bg-amber-200 hover:text-amber-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
