"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn, initials } from "@/lib/utils";

// Muestra la foto de una persona y, si la imagen falla al cargar (404, enlace
// roto, etc.), cae con elegancia a un avatar con iniciales. Nunca se ve una
// imagen rota como en el sitio original. Con `zoomable` (en la ficha), tocar la
// foto la abre a pantalla completa.
export function PersonPhoto({
  src,
  firstName,
  lastName,
  isUnidentified,
  className = "",
  fallbackTextClass = "text-4xl",
  zoomable = false,
}: {
  src: string | null;
  firstName: string;
  lastName: string;
  isUnidentified: boolean;
  className?: string;
  fallbackTextClass?: string;
  zoomable?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const showImage = src && !failed;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const alt = `${firstName} ${lastName}`.trim() || "Persona";

  if (showImage) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          onClick={zoomable ? () => setOpen(true) : undefined}
          className={cn("h-full w-full object-cover", zoomable && "cursor-zoom-in", className)}
        />
        {open && (
          <div
            className="animate-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Foto ampliada"
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar foto"
              className="press absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              onClick={(e) => e.stopPropagation()}
              className="animate-zoom max-h-[90dvh] max-w-full cursor-zoom-out rounded-lg object-contain shadow-2xl"
            />
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
      <span className={`font-bold text-zinc-300 ${fallbackTextClass}`}>
        {isUnidentified ? "?" : initials(firstName, lastName)}
      </span>
    </div>
  );
}
