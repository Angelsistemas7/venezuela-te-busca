"use client";

import { useEffect, useState } from "react";
import {
  PERSON_REACTION_EMOJI,
  PERSON_REACTION_LABEL,
  type PersonReaction,
} from "@/lib/types";
import { reactToPersonAction } from "@/app/actions";
import { cn } from "@/lib/utils";

// "Difundir" vive aparte como su propio botón "Compartir" (ver
// PersonShareButton.tsx), debajo de "Guardar" — mezclarlo con estas dos
// reacciones de apoyo emocional se sentía confuso (una cosa es animar, otra
// es compartir el enlace).
const KINDS: PersonReaction[] = ["fuerza", "corazon"];

export function PersonReactions({
  personId,
  reactions,
}: {
  personId: string;
  reactions: Record<PersonReaction, number>;
}) {
  const [counts, setCounts] = useState(reactions);
  const [reacted, setReacted] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const state: Record<string, boolean> = {};
    for (const k of KINDS) {
      if (localStorage.getItem(`vtb_preact_${personId}_${k}`)) state[k] = true;
    }
    setReacted(state);
  }, [personId]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  async function react(kind: PersonReaction) {
    if (reacted[kind]) return;
    setReacted((r) => ({ ...r, [kind]: true }));
    setCounts((c) => ({ ...c, [kind]: (c[kind] ?? 0) + 1 }));
    localStorage.setItem(`vtb_preact_${personId}_${kind}`, "1");
    const res = await reactToPersonAction(personId, kind);
    if (!res.ok) {
      // El servidor no lo guardó de verdad: revertimos para no dejar el
      // botón marcado "para siempre" con un contador que nunca subió.
      setReacted((r) => ({ ...r, [kind]: false }));
      setCounts((c) => ({ ...c, [kind]: Math.max(0, (c[kind] ?? 1) - 1) }));
      localStorage.removeItem(`vtb_preact_${personId}_${kind}`);
      flash("No se pudo guardar. Intenta de nuevo.");
    }
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k}
            onClick={() => react(k)}
            disabled={reacted[k]}
            className={cn(
              "press flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition",
              reacted[k]
                ? "border-brand-300 bg-brand-50 text-brand-700"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50",
            )}
          >
            <span className="text-base">{PERSON_REACTION_EMOJI[k]}</span>
            {PERSON_REACTION_LABEL[k]}
            <span className="tabular-nums text-zinc-400">{counts[k] ?? 0}</span>
          </button>
        ))}
      </div>
      {toast && (
        <div className="animate-fade-in absolute -top-9 left-0 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
