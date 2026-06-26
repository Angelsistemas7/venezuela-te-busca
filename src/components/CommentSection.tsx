"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, MessageCircle, Send, X } from "lucide-react";
import type { Comment, CommentEntity } from "@/lib/types";
import { postCommentAction } from "@/app/actions";
import { uploadPhoto } from "@/lib/upload";
import { compressImage } from "@/lib/image";
import { timeAgo } from "@/lib/utils";

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
  const fileRef = useRef<File | null>(null);

  const canSubmit = name.trim().length >= 2 && (body.trim().length >= 2 || fileRef.current);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !canSubmit) return;
    setSubmitting(true);
    setError(null);

    const form = new FormData();
    form.set("entityType", entityType);
    form.set("entityId", entityId);
    form.set("authorName", name);
    form.set("body", body);

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
          authorName: name,
          body,
          photoUrl: photoUrl ?? preview,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setBody("");
      setPreview(null);
      fileRef.current = null;
    } else {
      setError(res.error);
    }
    setSubmitting(false);
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5">
      <h2 className="flex items-center gap-2 font-semibold text-zinc-900">
        <MessageCircle className="h-4.5 w-4.5 text-zinc-500" />
        {title}
        <span className="text-sm font-normal text-zinc-400">({comments.length})</span>
      </h2>

      <form onSubmit={submit} className="mt-4 space-y-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        <div className="flex gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={placeholder}
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
        {comments.length === 0 && (
          <li className="py-4 text-center text-sm text-zinc-400">
            Aún no hay comentarios. Sé el primero en aportar información.
          </li>
        )}
        {comments.map((c) => (
          <li key={c.id} className="rounded-xl bg-zinc-50 p-3">
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
          </li>
        ))}
      </ul>
    </section>
  );
}
