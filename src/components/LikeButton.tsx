"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { likeAidPointAction, likeHospitalAction, likeMarchAction } from "@/app/actions";
import { cn } from "@/lib/utils";

type Kind = "aid" | "march" | "hospital";

const ACTION: Record<Kind, (id: string) => Promise<{ ok: boolean }>> = {
  aid: likeAidPointAction,
  march: likeMarchAction,
  hospital: likeHospitalAction,
};

// "Me gusta" de la comunidad a una publicación de recurso. Uno por dispositivo.
export function LikeButton({ kind, id, likes }: { kind: Kind; id: string; likes: number }) {
  const router = useRouter();
  const [count, setCount] = useState(likes);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(`vtb_like_${kind}_${id}`)) setLiked(true);
  }, [kind, id]);

  async function like() {
    if (liked) return;
    setLiked(true);
    setCount((n) => n + 1);
    localStorage.setItem(`vtb_like_${kind}_${id}`, "1");
    await ACTION[kind](id);
    router.refresh();
  }

  return (
    <button
      onClick={like}
      disabled={liked}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition active:scale-95",
        liked
          ? "border-rose-200 bg-rose-50 text-rose-600"
          : "border-zinc-200 text-zinc-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600",
      )}
    >
      <Heart className={cn("h-4 w-4", liked && "fill-rose-500 text-rose-500")} />
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
