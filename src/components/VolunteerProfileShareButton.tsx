"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

// Comparte el enlace público del perfil de voluntario digital (mismo patrón
// que PersonShareButton): navigator.share si el navegador lo soporta, si no
// copia el texto + enlace al portapapeles. La vista previa bonita (logo +
// foto + estadísticas) la genera el opengraph-image de esa ruta pública.
export function VolunteerProfileShareButton({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/perfil/publico/${encodeURIComponent(username)}`;
    const text =
      "Este es mi perfil de voluntario digital en El Mundo Te Busca. Quiero invitarte a que también seas uno — juntos podemos salvar más vidas.";

    try {
      if (navigator.share) {
        await navigator.share({ title: "Mi perfil de voluntario digital", text, url });
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
      className="press flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
    >
      <Share2 className="h-4 w-4" />
      {copied ? "Enlace copiado" : "Compartir mi perfil"}
    </button>
  );
}
