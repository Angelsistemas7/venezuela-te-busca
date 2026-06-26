"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { voteAidAvailabilityAction } from "@/app/actions";
import { cn } from "@/lib/utils";

// Consenso comunitario sobre la disponibilidad de un punto de ayuda.
// Si "se acabó" supera a "sí hay", el punto pasa a agotado automáticamente.
export function AidConsensusVote({
  id,
  votesAvailable,
  votesDepleted,
}: {
  id: string;
  votesAvailable: number;
  votesDepleted: number;
}) {
  const router = useRouter();
  const [va, setVa] = useState(votesAvailable);
  const [vd, setVd] = useState(votesDepleted);
  const [voted, setVoted] = useState<"available" | "depleted" | null>(null);

  useEffect(() => {
    const v = localStorage.getItem(`vtb_aidvote_${id}`);
    if (v === "available" || v === "depleted") setVoted(v);
  }, [id]);

  async function vote(kind: "available" | "depleted") {
    if (voted) return;
    setVoted(kind);
    if (kind === "available") setVa((n) => n + 1);
    else setVd((n) => n + 1);
    localStorage.setItem(`vtb_aidvote_${id}`, kind);
    await voteAidAvailabilityAction(id, kind);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-400">¿Sigue disponible?</span>
      <button
        onClick={() => vote("available")}
        disabled={!!voted}
        className={cn(
          "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition disabled:opacity-70",
          voted === "available"
            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
            : "border-zinc-200 text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700",
        )}
      >
        <Check className="h-3.5 w-3.5" /> Sí hay <span className="tabular-nums">{va}</span>
      </button>
      <button
        onClick={() => vote("depleted")}
        disabled={!!voted}
        className={cn(
          "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition disabled:opacity-70",
          voted === "depleted"
            ? "border-rose-300 bg-rose-50 text-rose-700"
            : "border-zinc-200 text-zinc-600 hover:bg-rose-50 hover:text-rose-700",
        )}
      >
        <X className="h-3.5 w-3.5" /> Se acabó <span className="tabular-nums">{vd}</span>
      </button>
    </div>
  );
}
