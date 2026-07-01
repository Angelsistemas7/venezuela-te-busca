"use client";

import { useState } from "react";
import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import { Modal } from "./Modal";

// Envuelve un enlace externo (sobre todo contenido que pega un tercero, como
// el "linkUrl" de un post) con un pequeño aviso de "vas a salir de la página"
// antes de abrirlo. Reutiliza el Modal compartido: hereda su animación de
// entrada/salida y el portal (no se corta ni sale descolocado en móvil).
export function ExternalLinkGuard({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  let host = href;
  try {
    host = new URL(href).hostname.replace(/^www\./, "");
  } catch {
    /* si la URL es inválida, mostramos el texto tal cual */
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Vas a salir de la página"
        subtitle="Es contenido publicado por un tercero: nosotros no lo verificamos."
      >
        <p className="truncate rounded-lg bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-800">{host}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => setOpen(false)}
            className="press rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Cancelar
          </button>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="press inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Continuar
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>
        </div>
      </Modal>
    </>
  );
}
