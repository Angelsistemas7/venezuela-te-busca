"use client";

import { useEffect, useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { addMyPub, type MyPubType } from "@/lib/myPubs";

// Muestra el enlace privado de gestión que se entrega a quien publica.
// Con ese enlace —y solo con él— el autor puede editar o eliminar su
// publicación (y, en personas, cambiar su estado), sin crear una cuenta.
// `basePath` define la sección: /persona, /ayuda o /caravanas.
// Además, recuerda la publicación en este dispositivo (para "Mis publicaciones"
// y los avisos de actividad), sin crear cuenta ni pedir datos.
export function ManageLinkBox({
  id,
  token,
  entityType,
  title,
  basePath = "/persona",
  note = "Con este enlace —y solo con él— podrás marcar a la persona como localizada, editar o eliminar la publicación.",
}: {
  id: string;
  token: string;
  entityType: MyPubType;
  title: string;
  basePath?: string;
  note?: string;
}) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const origin = window.location.origin;
    setUrl(`${origin}${basePath}/${id}/gestion?token=${token}`);
  }, [id, token, basePath]);

  // Recuerda esta publicación en el dispositivo para la campanita de avisos.
  useEffect(() => {
    addMyPub({ type: entityType, id, token, title, createdAt: new Date().toISOString() });
  }, [entityType, id, token, title]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="mt-5 w-full rounded-xl border border-amber-300 bg-amber-50 p-4 text-left">
      <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
        <KeyRound className="h-4 w-4" />
        Guarda tu enlace privado de gestión
      </p>
      <p className="mt-1 text-xs text-amber-800">
        {note} <strong>Guárdalo:</strong> no se vuelve a mostrar y no pedimos cuenta. No lo
        compartas con desconocidos.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs text-zinc-700 outline-none"
        />
        <button
          onClick={copy}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
    </div>
  );
}
