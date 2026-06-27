"use client";

import { useEffect, useState } from "react";
import { ExternalLink, MapPin, MessageCircle, Pin } from "lucide-react";
import type { Comment, Post, ReactionKind } from "@/lib/types";
import { POST_TYPE_EMOJI, POST_TYPE_LABEL, REACTION_EMOJI } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { reactToPostAction } from "@/app/actions";
import { CommentSection } from "./CommentSection";

const TYPE_STYLE: Record<Post["type"], string> = {
  necesito: "bg-rose-50 text-rose-700 border-rose-200",
  ofrezco: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rescate: "bg-red-100 text-red-800 border-red-300",
  medico: "bg-sky-50 text-sky-700 border-sky-200",
  caravana: "bg-violet-50 text-violet-700 border-violet-200",
  identificar: "bg-zinc-100 text-zinc-700 border-zinc-200",
  info: "bg-amber-50 text-amber-700 border-amber-200",
};

const REACTIONS: ReactionKind[] = ["apoyo", "corazon", "hecho"];

export function PostCard({ post, comments }: { post: Post; comments: Comment[] }) {
  const [counts, setCounts] = useState(post.reactions);
  const [reacted, setReacted] = useState<Record<string, boolean>>({});
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    const state: Record<string, boolean> = {};
    for (const k of REACTIONS) {
      if (localStorage.getItem(`vtb_react_${post.id}_${k}`)) state[k] = true;
    }
    setReacted(state);
  }, [post.id]);

  async function react(kind: ReactionKind) {
    if (reacted[kind]) return;
    setReacted((r) => ({ ...r, [kind]: true }));
    setCounts((c) => ({ ...c, [kind]: (c[kind] ?? 0) + 1 }));
    localStorage.setItem(`vtb_react_${post.id}_${kind}`, "1");
    await reactToPostAction(post.id, kind);
  }

  const urgent = post.type === "rescate";

  return (
    <article
      className={cn(
        "rounded-2xl border bg-white p-4 shadow-sm sm:p-5",
        urgent ? "border-red-300 ring-1 ring-red-200" : "border-zinc-200",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {post.pinned && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
            <Pin className="h-3.5 w-3.5" />
            Fijado
          </span>
        )}
        <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold", TYPE_STYLE[post.type])}>
          <span>{POST_TYPE_EMOJI[post.type]}</span>
          {POST_TYPE_LABEL[post.type]}
        </span>
        {(post.locationText || post.estado) && (
          <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
            <MapPin className="h-3.5 w-3.5" />
            {[post.locationText, post.estado].filter(Boolean).join(", ")}
          </span>
        )}
        <span className="ml-auto text-xs text-zinc-400">{timeAgo(post.createdAt)}</span>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-800">{post.body}</p>

      {post.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.photoUrl}
          alt=""
          loading="lazy"
          className="mt-3 max-h-96 w-full rounded-xl object-cover"
        />
      )}

      {post.linkUrl && (
        <a
          href={post.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-sky-700 hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          Ver enlace / video
        </a>
      )}

      <div className="mt-2 text-xs text-zinc-500">
        Publicado por <span className="font-medium text-zinc-700">{post.authorName}</span>
        {post.contactPhone && (
          <>
            {" · "}
            <a href={`tel:${post.contactPhone}`} className="text-brand-700 hover:underline">
              {post.contactPhone}
            </a>
          </>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
        {REACTIONS.map((k) => (
          <button
            key={k}
            onClick={() => react(k)}
            disabled={reacted[k]}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition",
              reacted[k]
                ? "border-brand-300 bg-brand-50 text-brand-700"
                : "border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 active:scale-95",
            )}
          >
            <span>{REACTION_EMOJI[k]}</span>
            <span className="tabular-nums">{counts[k] ?? 0}</span>
          </button>
        ))}
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
            entityType="post"
            entityId={post.id}
            initialComments={comments}
            title="Comentarios"
            placeholder="Responde, coordina, aporta..."
          />
        </div>
      )}
    </article>
  );
}
