"use client";

import { useSyncExternalStore, useState } from "react";
import { Bookmark } from "lucide-react";
import type { SavedEntity } from "@/lib/types";
import {
  getServerSnapshot,
  getSnapshot,
  savedKey,
  subscribe,
  toggleSaved,
} from "@/lib/savedStore";
import { cn } from "@/lib/utils";

// Botón "Guardar" (seguir) una publicación. Requiere sesión: si no hay, abre el
// modal de inicio de sesión. El estado lo comparte savedStore, así que muchos
// botones en la página comparten una sola consulta. Optimista.
export function SaveButton({
  type,
  id,
  title,
  className,
  showLabel = true,
}: {
  type: SavedEntity;
  id: string;
  title: string;
  className?: string;
  showLabel?: boolean;
}) {
  const set = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const saved = set.has(savedKey(type, id));
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await toggleSaved(type, id, title);
      if (!res.ok && res.reason === "auth") {
        // Sin sesión: invitamos a entrar (mismo evento que usa el banner).
        window.dispatchEvent(new CustomEvent("vtb:auth-open", { detail: { mode: "login" } }));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      aria-pressed={saved}
      title={saved ? "Quitar de guardados" : "Guardar para seguir su actividad"}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition active:scale-95 disabled:opacity-60",
        saved
          ? "border-brand-300 bg-brand-50 text-brand-700"
          : "border-zinc-200 text-zinc-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700",
        className,
      )}
    >
      <Bookmark className={cn("h-4 w-4", saved && "fill-brand-500 text-brand-500")} />
      {showLabel && <span>{saved ? "Guardado" : "Guardar"}</span>}
    </button>
  );
}
