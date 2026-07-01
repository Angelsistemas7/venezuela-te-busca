"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

// Botón "Compartir" de una ficha de mascota. Mismo mecanismo que
// PersonShareButton (Web Share API con respaldo de copiar al portapapeles).
export function PetShareButton({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `Ayúdanos a encontrar a ${name}. El Mundo Te Busca.`;

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
