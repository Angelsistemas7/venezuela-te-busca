"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

const MESSAGE =
  "🆘 El Mundo Te Busca: ayuda a localizar personas desaparecidas y a coordinar ayuda tras el terremoto de Venezuela 2026. Entre más personas vean esta página, más personas pueden estar a salvo. Compártela:";

function siteUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "";
}

export function ShareWhatsApp({ variant = "primary" }: { variant?: "primary" | "subtle" }) {
  const [copied, setCopied] = useState(false);
  const url = siteUrl();
  const waHref = `https://wa.me/?text=${encodeURIComponent(`${MESSAGE} ${url}`)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className={
          variant === "primary"
            ? "inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1ebe5b]"
            : "inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
        }
      >
        <Share2 className="h-4 w-4" />
        Compartir por WhatsApp
      </a>
      <button
        onClick={copy}
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copiado" : "Copiar enlace"}
      </button>
    </div>
  );
}
