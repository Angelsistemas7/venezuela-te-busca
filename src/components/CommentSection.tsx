"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CornerDownRight, Heart, ImagePlus, Loader2, MessageCircle, Reply, Send, X } from "lucide-react";
import type { Comment, CommentEntity } from "@/lib/types";
import { likeCommentAction, postCommentAction } from "@/app/actions";
import { uploadPhoto } from "@/lib/upload";
import { compressImage } from "@/lib/image";
import { cn, timeAgo } from "@/lib/utils";

export function CommentSection({
  entityType,
  entityId,
  initialComments,
  title = "Comunidad",
  placeholder = "Aporta lo que sepas: lo vi, lo reconozco, dónde estaba...",
}: {
  entityType: CommentEntity;
  entityId: string;
  initialComments: Comment[];
  title?: string;
  placeholder?: string;
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; authorName: string } | null>(null);
  const fileRef = useRef<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSubmit = name.trim().length >= 2 && (body.trim().length >= 2 || fileRef.current);

  // Hilos de un nivel: comentarios raíz (más recientes arriba) + respuestas por
  // raíz (en orden cronológico, para que la conversación se lea de arriba abajo).
  const { roots, repliesByParent } = useMemo(() => {
    const roots = comments
      .filter((c) => !c.parentId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const repliesByParent = new Map<string, Comment[]>();
    for (const c of comments) {
      if (!c.parentId) continue;
      const arr = repliesByParent.get(c.parentId) ?? [];
      arr.push(c);
      repliesByParent.set(c.parentId, arr);
    }
    for (const arr of repliesByParent.values()) {
      arr.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
    return { roots, repliesByParent };
  }, [comments]);

  function startReply(c: Comment) {
    // Si responden a una respuesta, el hilo se mantiene en un solo nivel:
    // cuelga de la raíz, pero se menciona a quién se responde.
    setReplyTo({ id: c.parentId ?? c.id, authorName: c.authorName });
    textareaRef.current?.focus();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !canSubmit) return;
    setSubmitting(true);
    setError(null);

    const parentId = replyTo?.id ?? null;
    const form = new FormData();
    form.set("entityType", entityType);
    form.set("entityId", entityId);
    form.set("authorName", name);
    form.set("body", body);
    if (parentId) form.set("parentId", parentId);

    let photoUrl: string | null = null;
    if (fileRef.current) {
      try {
        photoUrl = await uploadPhoto(await compressImage(fileRef.current));
        if (photoUrl) form.set("photoUrl", photoUrl);
      } catch {
        /* continúa sin foto */
      }
    }

    const res = await postCommentAction(form);
    if (res.ok) {
      setComments((prev) => [
        {
          id: `tmp-${Date.now()}`,
          entityType,
          entityId,
          parentId,
          authorName: name,
          body,
          photoUrl: photoUrl ?? preview,
          likes: 0,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setBody("");
      setPreview(null);
      setReplyTo(null);
      fileRef.current = null;
    } else {
      setError(res.error);
    }
    setSubmitting(false);
  }

  function renderComment(c: Comment, isReply: boolean) {
    const replies = isReply ? [] : repliesByParent.get(c.id) ?? [];
    return (
      <li key={c.id} className={isReply ? "" : "rounded-xl bg-zinc-50 p-3"}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-zinc-800">{c.authorName}</span>
          <span className="text-xs text-zinc-400">{timeAgo(c.createdAt)}</span>
        </div>
        {c.body && <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600">{c.body}</p>}
        {c.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.photoUrl}
            alt="Evidencia"
            loading="lazy"
            className="mt-2 max-h-72 rounded-lg object-cover"
          />
        )}
        <div className="mt-1.5 flex items-center gap-4">
          <CommentLike id={c.id} likes={c.likes} />
          <button
            type="button"
            onClick={() => startReply(c)}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-brand-700"
          >
            <Reply className="h-3.5 w-3.5" />
            Responder
          </button>
        </div>

        {replies.length > 0 && (
          <ul className="mt-2 space-y-2.5 border-l-2 border-zinc-200 pl-3">
            {replies.map((r) => renderComment(r, true))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5">
      <h2 className="flex items-center gap-2 font-semibold text-zinc-900">
        <MessageCircle className="h-4.5 w-4.5 text-zinc-500" />
        {title}
        <span className="text-sm font-normal text-zinc-400">({comments.length})</span>
      </h2>

      <form onSubmit={submit} className="mt-4 space-y-2">
        {replyTo && (
          <div className="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-800">
            <span className="inline-flex items-center gap-1">
              <CornerDownRight className="h-3.5 w-3.5" />
              Respondiendo a {replyTo.authorName}
            </span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="hover:text-brand-900"
              aria-label="Cancelar respuesta"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={replyTo ? `Responde a ${replyTo.authorName}...` : placeholder}
            rows={2}
            className="w-full resize-y rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          <div className="flex flex-col gap-1.5 self-end">
            <label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-zinc-300 text-zinc-500 hover:bg-zinc-50" title="Adjuntar foto">
              <ImagePlus className="h-4 w-4" />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  fileRef.current = file;
                  setPreview(URL.createObjectURL(file));
                }}
              />
            </label>
            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {preview && (
          <div className="relative w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Adjunto" className="h-20 rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                fileRef.current = null;
              }}
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
      </form>

      <ul className="mt-5 space-y-3">
        {roots.length === 0 && (
          <li className="py-4 text-center text-sm text-zinc-400">
            Aún no hay comentarios. Sé el primero en aportar información.
          </li>
        )}
        {roots.map((c) => renderComment(c, false))}
      </ul>
    </section>
  );
}

// "Me gusta" a un comentario. Uno por dispositivo (dedup con localStorage).
function CommentLike({ id, likes }: { id: string; likes: number }) {
  const [count, setCount] = useState(likes);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(`vtb_clike_${id}`)) setLiked(true);
  }, [id]);

  async function like() {
    if (liked) return;
    setLiked(true);
    setCount((n) => n + 1);
    localStorage.setItem(`vtb_clike_${id}`, "1");
    await likeCommentAction(id);
  }

  return (
    <button
      type="button"
      onClick={like}
      disabled={liked}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium transition",
        liked ? "text-rose-600" : "text-zinc-500 hover:text-rose-600",
      )}
    >
      <Heart className={cn("h-3.5 w-3.5", liked && "fill-rose-500 text-rose-500")} />
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
