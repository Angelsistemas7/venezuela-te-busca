"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Miniatura que, al tocarla, abre la foto a pantalla completa con un leve
// "zoom" (entrar/salir). Todo CSS (transform/opacity): GPU-friendly, sin tocar
// el servidor. Cerrar con clic, botón o Esc.
export function PhotoView({
  src,
  alt = "",
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

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

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onClick={() => setOpen(true)}
        className={cn("cursor-zoom-in transition hover:brightness-95", className)}
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
