"use client";

import Link from "next/link";
import { Bell, Bookmark, FileWarning, MessageCircle } from "lucide-react";
import { TYPE_LABEL, useNotifications } from "@/lib/useNotifications";

export default function NotificacionesPage() {
  const { entries, newsOf, totalNew, markRead, linkFor } = useNotifications();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
            <Bell className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Notificaciones
            </h1>
            <p className="mt-1 text-zinc-500">
              Lo que publicaste (en este dispositivo o tu cuenta) y lo que guardaste.
            </p>
          </div>
        </div>
        {totalNew > 0 && (
          <button
            onClick={markRead}
            className="press shrink-0 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Marcar todo como leído
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white py-12 text-center text-sm text-zinc-500">
          Nada por aquí todavía. Publica algo o guarda una publicación para seguir su actividad.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          {entries.map((e) => {
            const n = newsOf(e);
            return (
              <li key={e.key}>
                <Link
                  href={linkFor(e)}
                  className="press flex items-start gap-3 px-4 py-3.5 transition hover:bg-zinc-50"
                >
                  <span
                    aria-hidden
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      n.total > 0 ? "bg-rose-500" : "bg-transparent"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm font-semibold text-zinc-900">{e.title}</span>
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
                      <span className="mt-1.5 flex flex-wrap gap-2 text-xs">
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
                      <span className="mt-1.5 block text-xs text-zinc-400">Sin novedades</span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
