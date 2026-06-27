"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, ExternalLink, FileWarning, MessageCircle } from "lucide-react";
import { getActivityForEntities, getMyPublicationsAction } from "@/app/actions";
import {
  activityKey,
  getMyPubs,
  getSeen,
  managePath,
  markSeen,
  type Counts,
  type MyPub,
} from "@/lib/myPubs";

type Activity = Record<string, Counts>;

const TYPE_LABEL: Record<MyPub["type"], string> = {
  person: "Persona",
  post: "Publicación",
  aid_point: "Punto de ayuda",
  march: "Caravana",
};

// Campanita de "Mis publicaciones": recuerda lo que publicaste en este
// dispositivo y avisa cuando hay comentarios o reportes nuevos. Sin cuentas,
// sin servidores de notificaciones: compara el conteo actual con el visto.
export function NotificationBell() {
  const [pubs, setPubs] = useState<MyPub[]>([]);
  const [activity, setActivity] = useState<Activity>({});
  const [seen, setSeenState] = useState<Activity>({});
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    // Publicaciones de este dispositivo (token) + las de tu cuenta (cross-device).
    const local = getMyPubs();
    let all = local;
    try {
      const account = await getMyPublicationsAction();
      if (account.length > 0) {
        const known = new Set(local.map((p) => activityKey(p.type, p.id)));
        const extra: MyPub[] = account
          .filter((a) => !known.has(activityKey(a.type, a.id)))
          .map((a) => ({ type: a.type, id: a.id, token: "", title: a.title, createdAt: a.createdAt }));
        all = [...local, ...extra];
      }
    } catch {
      /* sin sesión o sin Supabase: solo las locales */
    }

    setPubs(all);
    setSeenState(getSeen());
    if (all.length === 0) {
      setActivity({});
      return;
    }
    try {
      const act = await getActivityForEntities(all.map((p) => ({ type: p.type, id: p.id })));
      setActivity(act);
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

  function newsOf(p: MyPub) {
    const k = activityKey(p.type, p.id);
    const cur = activity[k] ?? { comments: 0, reports: 0 };
    const base = seen[k] ?? { comments: 0, reports: 0 };
    const comments = Math.max(0, cur.comments - base.comments);
    const reports = Math.max(0, cur.reports - base.reports);
    return { comments, reports, total: comments + reports };
  }

  const totalNew = pubs.reduce((n, p) => n + newsOf(p).total, 0);

  function markRead() {
    markSeen(activity);
    setSeenState(getSeen());
  }

  // Sin publicaciones en este dispositivo: no hay nada que mostrar.
  if (pubs.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Mis publicaciones${totalNew > 0 ? ` (${totalNew} avisos nuevos)` : ""}`}
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
            <h2 className="text-sm font-bold text-zinc-900">Mis publicaciones</h2>
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
            {pubs.map((p) => {
              const n = newsOf(p);
              return (
                <li key={activityKey(p.type, p.id)}>
                  <Link
                    href={managePath(p.type, p.id, p.token)}
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
                        {p.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-zinc-400">{TYPE_LABEL[p.type]}</span>
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
            Se guardan en este dispositivo. Si cambias de teléfono o borras los datos del navegador,
            usa el enlace de gestión que guardaste al publicar.
          </p>
        </div>
      )}
    </div>
  );
}
