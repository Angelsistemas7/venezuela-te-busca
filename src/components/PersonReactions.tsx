"use client";

import { useEffect, useState } from "react";
import {
  PERSON_REACTION_EMOJI,
  PERSON_REACTION_LABEL,
  type PersonReaction,
} from "@/lib/types";
import { reactToPersonAction } from "@/app/actions";
import { cn } from "@/lib/utils";

const KINDS: PersonReaction[] = ["fuerza", "corazon", "difundir"];

export function PersonReactions({
  personId,
  name,
  reactions,
}: {
  personId: string;
  name: string;
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
    // "Difundir" además comparte el enlace; se puede repetir.
    if (kind === "difundir") {
      const url = typeof window !== "undefined" ? window.location.href : "";
      const text = `Ayúdanos a localizar a ${name}. El Mundo Te Busca.`;
      try {
        if (navigator.share) await navigator.share({ title: "El Mundo Te Busca", text, url });
        else {
          await navigator.clipboard.writeText(url);
          flash("Enlace copiado para compartir");
        }
      } catch {
        /* el usuario canceló */
      }
    } else if (reacted[kind]) {
      return;
    }

    if (!reacted[kind]) {
      setReacted((r) => ({ ...r, [kind]: true }));
      setCounts((c) => ({ ...c, [kind]: (c[kind] ?? 0) + 1 }));
      localStorage.setItem(`vtb_preact_${personId}_${kind}`, "1");
      await reactToPersonAction(personId, kind);
    }
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k}
            onClick={() => react(k)}
            disabled={reacted[k] && k !== "difundir"}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition active:scale-95",
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
