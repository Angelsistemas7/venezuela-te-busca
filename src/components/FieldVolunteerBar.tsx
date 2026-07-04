"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HandHeart, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Estado de módulo: vive mientras viva el JS de la pestaña, se reinicia al
// RECARGAR la página. Así el aviso "sale" (y anima) solo una vez por carga y, si
// se cierra, queda cerrado al navegar entre secciones — no vuelve a aparecer a
// menos que recargues. Es justo lo que pidió el usuario.
//
// IMPORTANTE (`shownThisLoad`, el flag de animación): solo se lee/muta dentro
// de un useEffect (nunca durante el render). El servidor de este sitio es un
// proceso Node de PM2 que vive corriendo (no una función serverless que se
// reinicia por petición) — si se mutara durante el render, el servidor la
// compartiría entre visitantes DISTINTOS (el primero pondría "ya se mostró"
// para todos los que llegaran después), mientras el cliente (que sí arranca
// su propio módulo desde cero en cada pestaña) calcularía otra cosa al
// hidratar: exactamente el mismo tipo de error de hidratación
// servidor/cliente que ya se corrigió una vez en ShareWhatsApp.tsx. Por eso
// el render en sí siempre arranca en `false` (determinista) y la animación
// se activa después, ya en el cliente.
//
// `dismissedThisLoad` (cerrar el aviso) es distinto: solo lo toca `close()`,
// un manejador de clic que NUNCA se ejecuta durante el renderizado en el
// servidor — leerlo directo en el render es seguro, no hay nada que hidratar
// mal (el servidor jamás lo pone en `true`).
let shownThisLoad = false;
let dismissedThisLoad = false;

// Barra de reclutamiento de voluntarios en el terreno. Cerrable; cero costo de
// servidor. Aparece/anima solo al recargar, no al cambiar de sección. Si la
// cuenta que inició sesión ya se ofreció como voluntario, no tiene sentido
// seguir invitándola: no se muestra.
export function FieldVolunteerBar({ alreadyVolunteered = false }: { alreadyVolunteered?: boolean }) {
  const [hidden, setHidden] = useState(dismissedThisLoad);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (!shownThisLoad) {
      shownThisLoad = true;
      setAnimate(true);
    }
  }, []);

  if (hidden || alreadyVolunteered) return null;

  function close() {
    dismissedThisLoad = true;
    setHidden(true);
  }

  return (
    <div className={cn(
      "mb-4 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-2.5 sm:gap-3 sm:p-3.5",
      animate && "animate-rise",
    )}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white sm:h-9 sm:w-9">
        <HandHeart className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
      </span>
      <p className="flex-1 text-xs leading-snug text-zinc-700 sm:text-sm">
        <strong className="text-zinc-900">¿Estás en la zona del terremoto?</strong> Reporta el estado
        de <strong>hospitales y refugios</strong>, o súmate como voluntario.
      </p>
      <Link
        href="/voluntarios"
        className="press shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 sm:text-sm"
      >
        Quiero ayudar
      </Link>
      <button
        onClick={close}
        aria-label="Cerrar aviso"
        className="press shrink-0 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
