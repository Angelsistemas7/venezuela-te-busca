"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const RESUME_DELAY_MS = 10_000;

/**
 * Pausa el vaivén leve (.hint-swipe) en cuanto el usuario toca o desliza la
 * fila, y lo retoma solo, solo, tras 10s sin más interacción. Antes el vaivén
 * era continuo sin parar, incluso mientras la persona lo estaba deslizando a
 * mano — se sentía como si "peleara" con el dedo.
 */
function useSwipeHintPause() {
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onInteract = useCallback(() => {
    setPaused(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setPaused(false), RESUME_DELAY_MS);
  }, []);

  return { paused, onInteract };
}

/** Caso más común: el mismo elemento se desliza a mano Y tiene el vaivén. */
export function SwipeHintRow({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  const { paused, onInteract } = useSwipeHintPause();
  return (
    <div
      className={cn(className, !paused && "hint-swipe")}
      onPointerDown={onInteract}
      onTouchStart={onInteract}
      onScroll={onInteract}
    >
      {children}
    </div>
  );
}

/**
 * Caso con un contenedor exterior que desliza (más angosto) y uno interior
 * más ancho que lleva el vaivén (cifras del inicio y del mapa; en escritorio
 * el interior pasa a ser una rejilla sin animación).
 */
export function SwipeHintNested({
  outerClassName,
  innerClassName,
  children,
}: {
  outerClassName: string;
  innerClassName: string;
  children: React.ReactNode;
}) {
  const { paused, onInteract } = useSwipeHintPause();
  return (
    <div
      className={outerClassName}
      onPointerDown={onInteract}
      onTouchStart={onInteract}
      onScroll={onInteract}
    >
      <div className={cn(innerClassName, !paused && "hint-swipe")}>{children}</div>
    </div>
  );
}
