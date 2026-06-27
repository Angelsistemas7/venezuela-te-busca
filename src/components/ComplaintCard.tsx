"use client";

import { useState } from "react";
import { MapPin, MessageCircle } from "lucide-react";
import type { Comment, Complaint, ComplaintCategory } from "@/lib/types";
import { COMPLAINT_CATEGORY_EMOJI, COMPLAINT_CATEGORY_LABEL } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { SupportButton } from "./SupportButton";
import { CommentSection } from "./CommentSection";

const CATEGORY_STYLE: Record<ComplaintCategory, string> = {
  riesgo_ninos: "bg-rose-50 text-rose-700 border-rose-200",
  desvio_ayuda: "bg-amber-50 text-amber-700 border-amber-200",
  fraude: "bg-violet-50 text-violet-700 border-violet-200",
  abuso_autoridad: "bg-orange-50 text-orange-700 border-orange-200",
  persona_desaparecida: "bg-sky-50 text-sky-700 border-sky-200",
  otra: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

export function ComplaintCard({ complaint, comments }: { complaint: Complaint; comments: Comment[] }) {
  const [showComments, setShowComments] = useState(false);
  const sensitive = complaint.category === "riesgo_ninos" || complaint.category === "abuso_autoridad";

  return (
    <article
      className={cn(
        "rounded-2xl border bg-white p-4 shadow-sm sm:p-5",
        sensitive ? "border-rose-200" : "border-zinc-200",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
            CATEGORY_STYLE[complaint.category],
          )}
        >
          <span>{COMPLAINT_CATEGORY_EMOJI[complaint.category]}</span>
          {COMPLAINT_CATEGORY_LABEL[complaint.category]}
        </span>
        {(complaint.locationText || complaint.estado) && (
          <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
            <MapPin className="h-3.5 w-3.5" />
            {[complaint.locationText, complaint.estado].filter(Boolean).join(", ")}
          </span>
        )}
        <span className="ml-auto text-xs text-zinc-400">{timeAgo(complaint.createdAt)}</span>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-800">{complaint.body}</p>

      {complaint.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={complaint.photoUrl}
          alt=""
          loading="lazy"
          className="mt-3 max-h-96 w-full rounded-xl object-cover"
        />
      )}

      <div className="mt-2 text-xs text-zinc-500">
        Reportado por <span className="font-medium text-zinc-700">{complaint.authorName}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
        <SupportButton id={complaint.id} supports={complaint.supports} />
        <button
          onClick={() => setShowComments((v) => !v)}
          className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
        >
          <MessageCircle className="h-4 w-4" />
          {comments.length > 0 ? `${comments.length} comentarios` : "Comentar"}
        </button>
      </div>

      {showComments && (
        <div className="mt-3">
          <CommentSection
            entityType="complaint"
            entityId={complaint.id}
            initialComments={comments}
            title="Comentarios"
            placeholder="Aporta datos para validar la denuncia (qué, dónde, cuándo). No es un chat."
          />
        </div>
      )}
    </article>
  );
}
