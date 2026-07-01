"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { reactToPersonAction } from "@/app/actions";

// Botón "Compartir" de una ficha de persona: va debajo de "Guardar". Antes
// vivía mezclado dentro de las reacciones (con "Fuerza"/"Cariño"), lo que
// confundía apoyo emocional con difundir el enlace. Sigue sumando al contador
// "difundir" de la persona (mismo dato de antes), solo que como su propio botón.
export function PersonShareButton({
  personId,
  name,
  unidentified,
  className = "",
}: {
  personId: string;
  name: string;
  unidentified: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const who = unidentified && !name ? "esta persona" : name;
    const text = unidentified
      ? `¿La reconoces? Alguien vio a ${who} y no se sabe quién es. El Mundo Te Busca.`
      : `Ayúdanos a localizar a ${who}. Sus familiares esperan verlo pronto. El Mundo Te Busca.`;

    reactToPersonAction(personId, "difundir").catch(() => {});

    try {
      if (navigator.share) {
        await navigator.share({ title: "El Mundo Te Busca", text, url });
        return;
      }
    } catch {
      return; // el usuario canceló el panel de compartir
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* portapapeles no disponible */
    }
  }

  return (
    <button
      onClick={share}
      className={`press flex items-center justify-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 ${className}`}
    >
      <Share2 className="h-4 w-4" />
      {copied ? "Enlace copiado" : "Compartir"}
    </button>
  );
}
