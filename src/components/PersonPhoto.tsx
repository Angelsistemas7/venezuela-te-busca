"use client";

import { useState } from "react";
import { initials } from "@/lib/utils";

// Muestra la foto de una persona y, si la imagen falla al cargar (404, enlace
// roto, etc.), cae con elegancia a un avatar con iniciales. Nunca se ve una
// imagen rota como en el sitio original.
export function PersonPhoto({
  src,
  firstName,
  lastName,
  isUnidentified,
  className = "",
  fallbackTextClass = "text-4xl",
}: {
  src: string | null;
  firstName: string;
  lastName: string;
  isUnidentified: boolean;
  className?: string;
  fallbackTextClass?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  if (showImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${firstName} ${lastName}`.trim() || "Persona"}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover ${className}`}
      />
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
