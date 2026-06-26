"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PackageCheck, PackageX } from "lucide-react";
import { voteHospitalSuppliesAction } from "@/app/actions";
import { cn } from "@/lib/utils";

// Consenso comunitario sobre si el hospital tiene insumos/abasto.
export function HospitalSuppliesVote({
  id,
  votesSupplies,
  votesNoSupplies,
  showBadge = true,
}: {
  id: string;
  votesSupplies: number;
  votesNoSupplies: number;
  showBadge?: boolean;
}) {
  const router = useRouter();
  const [vs, setVs] = useState(votesSupplies);
  const [vn, setVn] = useState(votesNoSupplies);
  const [voted, setVoted] = useState<"yes" | "no" | null>(null);

  useEffect(() => {
    const v = localStorage.getItem(`vtb_hospvote_${id}`);
    if (v === "yes" || v === "no") setVoted(v);
  }, [id]);

  async function vote(kind: "yes" | "no") {
    if (voted) return;
    setVoted(kind);
    if (kind === "yes") setVs((n) => n + 1);
    else setVn((n) => n + 1);
    localStorage.setItem(`vtb_hospvote_${id}`, kind);
    await voteHospitalSuppliesAction(id, kind);
    router.refresh();
  }

  const hasVotes = vs + vn > 0;
  const ok = vs >= vn;

  return (
    <div className="space-y-2">
      {showBadge && hasVotes && (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
            ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
          )}
        >
          {ok ? <PackageCheck className="h-3.5 w-3.5" /> : <PackageX className="h-3.5 w-3.5" />}
          {ok ? "Con insumos (consenso)" : "Faltan insumos (consenso)"}
        </span>
      )}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400">¿Tiene insumos?</span>
        <button
          onClick={() => vote("yes")}
          disabled={!!voted}
          className={cn(
            "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition disabled:opacity-70",
            voted === "yes" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-zinc-200 text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700",
          )}
        >
          Sí <span className="tabular-nums">{vs}</span>
        </button>
        <button
          onClick={() => vote("no")}
          disabled={!!voted}
          className={cn(
            "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition disabled:opacity-70",
            voted === "no" ? "border-rose-300 bg-rose-50 text-rose-700" : "border-zinc-200 text-zinc-600 hover:bg-rose-50 hover:text-rose-700",
          )}
        >
          No <span className="tabular-nums">{vn}</span>
        </button>
      </div>
    </div>
  );
}
