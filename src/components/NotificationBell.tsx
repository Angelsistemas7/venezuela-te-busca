"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Bookmark, ExternalLink, FileWarning, MessageCircle } from "lucide-react";
import {
  getActivityForEntities,
  getMyPublicationsAction,
  getSavedItemsAction,
} from "@/app/actions";
import type { CommentEntity } from "@/lib/types";
import {
  getMyPubs,
  getSeen,
  managePath,
  markSeen,
  type Counts,
  type MyPubType,
} from "@/lib/myPubs";

type Activity = Record<string, Counts>;

// Clave estable por entidad (mismo formato que usa myPubs), pero admite todos
// los tipos comentables (los guardados pueden ser hospital, denuncia, etc.).
const keyOf = (type: CommentEntity, id: string) => `${type}:${id}`;

// Una entrada de la campanita: o es TUYA (con enlace de gestión) o la GUARDASTE
// (con enlace público). Ambas avisan de comentarios nuevos.
type Entry = {
  key: string;
  type: CommentEntity;
  id: string;
  title: string;
  saved: boolean;
  token: string;
};

const TYPE_LABEL: Record<CommentEntity, string> = {
  person: "Persona",
  post: "Publicación",
  aid_point: "Punto de ayuda",
  march: "Caravana",
  hospital: "Hospital",
  complaint: "Denuncia",
  pet: "Mascota",
  hero: "Héroe",
  news_item: "Noticia",
};

// Enlace público para lo guardado. Lo que no tiene ficha propia va a su feed.
const PUBLIC_PATH: Record<CommentEntity, (id: string) => string> = {
  person: (id) => `/persona/${id}`,
  aid_point: (id) => `/ayuda/${id}`,
  march: (id) => `/caravanas/${id}`,
  hospital: (id) => `/hospitales/${id}`,
  post: () => "/comunidad",
  complaint: () => "/denuncias",
  pet: (id) => `/mascotas/${id}`,
  hero: () => "/noticias",
  news_item: () => "/noticias",
};

// Campanita de actividad: junta lo que publicaste en este dispositivo o cuenta
// con lo que guardaste, y avisa cuando hay comentarios o reportes nuevos. Sin
// servidores de notificaciones: compara el conteo actual con el visto.
export function NotificationBell() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [activity, setActivity] = useState<Activity>({});
  const [seen, setSeenState] = useState<Activity>({});
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    // 1) Publicaciones propias: de este dispositivo (token) + de tu cuenta.
    const owned: Entry[] = getMyPubs().map((p) => ({
      key: keyOf(p.type, p.id),
      type: p.type,
      id: p.id,
      title: p.title,
      saved: false,
      token: p.token,
    }));
    const known = new Set(owned.map((e) => e.key));
    try {
      const account = await getMyPublicationsAction();
      for (const a of account) {
        const k = keyOf(a.type, a.id);
        if (!known.has(k)) {
          owned.push({ key: k, type: a.type, id: a.id, title: a.title, saved: false, token: "" });
          known.add(k);
        }
      }
    } catch {
      /* sin sesión o sin Supabase: solo las locales */
    }

    // 2) Guardados (solo con cuenta). Omite los que ya son tuyos.
    let saved: Entry[] = [];
    try {
      const items = await getSavedItemsAction();
      saved = items
        .filter((s) => !known.has(keyOf(s.type, s.id)))
        .map((s) => ({
          key: keyOf(s.type, s.id),
          type: s.type,
          id: s.id,
          title: s.title || TYPE_LABEL[s.type],
          saved: true,
          token: "",
        }));
    } catch {
      /* sin sesión: sin guardados */
    }

    const all = [...owned, ...saved];
    setEntries(all);
    setSeenState(getSeen());
    if (all.length === 0) {
      setActivity({});
      return;
    }

    try {
      const act = await getActivityForEntities(all.map((e) => ({ type: e.type, id: e.id })));
      setActivity(act);

      // Línea base de los guardados nuevos: lo que YA tienen no cuenta como
      // nuevo; solo la actividad posterior a guardarlos te avisa.
      const seenNow = getSeen();
      const partial: Activity = {};
      for (const e of saved) {
        if (!seenNow[e.key]) partial[e.key] = act[e.key] ?? { comments: 0, reports: 0 };
      }
      if (Object.keys(partial).length > 0) {
        markSeen(partial);
        setSeenState(getSeen());
      }
    } catch {
      /* si falla la consulta, no rompemos la cabecera */
    }
  }, []);

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function newsOf(e: Entry) {
    const cur = activity[e.key] ?? { comments: 0, reports: 0 };
    const base = seen[e.key] ?? { comments: 0, reports: 0 };
    const comments = Math.max(0, cur.comments - base.comments);
    const reports = Math.max(0, cur.reports - base.reports);
    return { comments, reports, total: comments + reports };
  }

  const totalNew = entries.reduce((n, e) => n + newsOf(e).total, 0);

  function markRead() {
    markSeen(activity);
    setSeenState(getSeen());
  }

  function linkFor(e: Entry) {
    return e.saved
      ? PUBLIC_PATH[e.type](e.id)
      : managePath(e.type as MyPubType, e.id, e.token);
  }

  // Nada que mostrar (sin publicaciones ni guardados en este dispositivo/cuenta).
  if (entries.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Mis publicaciones y guardados${totalNew > 0 ? ` (${totalNew} avisos nuevos)` : ""}`}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100"
      >
        <Bell className="h-5 w-5" />
        {totalNew > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white">
            {totalNew > 9 ? "9+" : totalNew}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <h2 className="text-sm font-bold text-zinc-900">Publicaciones y guardados</h2>
            {totalNew > 0 && (
              <button
                onClick={markRead}
                className="text-xs font-medium text-brand-700 hover:underline"
              >
                Marcar como leído
              </button>
            )}
          </div>

          <ul className="max-h-[70vh] divide-y divide-zinc-100 overflow-y-auto">
            {entries.map((e) => {
              const n = newsOf(e);
              return (
                <li key={e.key}>
                  <Link
                    href={linkFor(e)}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 transition hover:bg-zinc-50"
                  >
                    <span
                      aria-hidden
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        n.total > 0 ? "bg-rose-500" : "bg-transparent"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 text-sm font-medium text-zinc-900">
                        {e.title}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400">
                        {TYPE_LABEL[e.type]}
                        {e.saved && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-1.5 py-0.5 font-medium text-brand-700">
                            <Bookmark className="h-3 w-3" />
                            Guardado
                          </span>
                        )}
                      </span>
                      {n.total > 0 ? (
                        <span className="mt-1 flex flex-wrap gap-2 text-xs">
                          {n.comments > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 font-medium text-rose-700">
                              <MessageCircle className="h-3 w-3" />
                              {n.comments} {n.comments === 1 ? "respuesta" : "respuestas"}
                            </span>
                          )}
                          {n.reports > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                              <FileWarning className="h-3 w-3" />
                              {n.reports} {n.reports === 1 ? "reporte" : "reportes"}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="mt-1 block text-xs text-zinc-400">Sin novedades</span>
                      )}
                    </span>
                    <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-zinc-300" />
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="border-t border-zinc-100 px-4 py-2.5 text-[11px] leading-snug text-zinc-400">
            Tus guardados y avisos viven en tu cuenta y este dispositivo. Guarda una publicación para
            seguir su actividad desde aquí.
          </p>
        </div>
      )}
    </div>
  );
}
