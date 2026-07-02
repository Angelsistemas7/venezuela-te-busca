"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Info, MapPin, RotateCcw, Search, Undo2, X } from "lucide-react";
import type { Comment, Person } from "@/lib/types";
import { PERSON_STATUS_LABEL } from "@/lib/types";
import { cn, statusStyle } from "@/lib/utils";
import { getPersonCommentsAction } from "@/app/actions";
import { PersonPhoto } from "./PersonPhoto";
import { Modal } from "./Modal";
import { CommentSection } from "./CommentSection";

// Baraja tipo "Tinder" para "¿La reconoces?": muestra una persona a la vez, en
// una tarjeta grande con su foto y rasgos. Se desliza:
//   • derecha → "La reconozco": lleva a su ficha para dejar información.
//   • izquierda → "Otra": pasa a la siguiente.
// Además: tocar la foto la amplía; el botón ℹ️ abre sus datos y comentarios
// SIN salir de la baraja; el botón ↺ deshace y vuelve a la tarjeta anterior.
// También funciona con botones y con flechas del teclado (accesible).

const THRESHOLD = 110;
const TAP_SLOP = 6; // movimiento máximo (px) para que cuente como toque, no arrastre

export function RecognizeDeck({ persons }: { persons: Person[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [photoOpen, setPhotoOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const draggedRef = useRef(false);

  const current = persons[index];
  const upcoming = persons[index + 1];

  const advance = useCallback(() => {
    setDrag({ x: 0, y: 0, active: false });
    startRef.current = null;
    setIndex((i) => Math.min(i + 1, persons.length));
  }, [persons.length]);

  const undo = useCallback(() => {
    setDrag({ x: 0, y: 0, active: false });
    startRef.current = null;
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  const recognize = useCallback(
    (p: Person | undefined) => {
      if (p) router.push(`/persona/${p.id}`);
    },
    [router],
  );

  function openInfo() {
    if (!current) return;
    setInfoOpen(true);
    if (commentsFor !== current.id) {
      setComments(null);
      setCommentsFor(current.id);
      getPersonCommentsAction(current.id)
        .then(setComments)
        .catch(() => setComments([]));
    }
  }

  // Teclado: ← pasa, → reconozco, ↑ deshace.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (infoOpen || photoOpen) return;
      if (!current) return;
      if (e.key === "ArrowLeft") advance();
      else if (e.key === "ArrowRight") recognize(current);
      else if (e.key === "ArrowUp") undo();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, advance, recognize, undo, infoOpen, photoOpen]);

  function onPointerDown(e: React.PointerEvent) {
    startRef.current = { x: e.clientX, y: e.clientY };
    draggedRef.current = false;
    setDrag({ x: 0, y: 0, active: true });
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (Math.abs(dx) > TAP_SLOP || Math.abs(dy) > TAP_SLOP) draggedRef.current = true;
    setDrag({ x: dx, y: dy, active: true });
  }
  function onPointerUp() {
    if (!startRef.current) return;
    const dx = drag.x;
    const wasTap = !draggedRef.current;
    startRef.current = null;
    if (wasTap) {
      setDrag({ x: 0, y: 0, active: false });
      setPhotoOpen(true);
      return;
    }
    if (dx > THRESHOLD) recognize(current);
    else if (dx < -THRESHOLD) advance();
    setDrag({ x: 0, y: 0, active: false });
  }

  if (persons.length === 0) {
    return (
      <div className="mx-auto max-w-sm rounded-3xl border border-zinc-200 bg-white p-8 text-center">
        <Search className="mx-auto h-8 w-8 text-zinc-300" />
        <h3 className="mt-3 font-bold text-zinc-900">Nadie por ahora</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Aquí aparecen los casos aún sin resolver. ¿Reconoces a alguien? Publícalo para que su
          familia lo sepa.
        </p>
      </div>
    );
  }

  // Fin de la baraja.
  if (!current) {
    return (
      <div className="mx-auto max-w-sm rounded-3xl border border-zinc-200 bg-white p-8 text-center">
        <Check className="mx-auto h-9 w-9 text-emerald-500" />
        <h3 className="mt-3 font-bold text-zinc-900">Revisaste a todas</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Gracias por mirar. Si reconociste a alguien, entra en su ficha y deja la información.
        </p>
        <button
          onClick={() => {
            setIndex(0);
            setDrag({ x: 0, y: 0, active: false });
          }}
          className="press mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          <RotateCcw className="h-4 w-4" />
          Volver a empezar
        </button>
      </div>
    );
  }

  const rot = drag.x / 18;
  const likeOpacity = Math.min(Math.max(drag.x / THRESHOLD, 0), 1);
  const passOpacity = Math.min(Math.max(-drag.x / THRESHOLD, 0), 1);
  const fullName = `${current.firstName} ${current.lastName}`.trim();
  const displayName = fullName || "Persona sin identificar";

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="relative h-[54dvh] max-h-[560px] min-h-[380px] w-full select-none">
        {upcoming && <DeckCard key={upcoming.id} person={upcoming} behind />}
        <DeckCard
          key={current.id}
          person={current}
          likeOpacity={likeOpacity}
          passOpacity={passOpacity}
          style={{
            transform: `translate(${drag.x}px, ${drag.y}px) rotate(${rot}deg)`,
            transition: drag.active ? "none" : "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </div>

      {/* Controles */}
      <div className="mt-5 flex items-center justify-center gap-4">
        <button
          onClick={undo}
          disabled={index === 0}
          aria-label="Deshacer, volver a la anterior"
          className="press flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400 shadow-sm transition hover:border-zinc-300 hover:text-zinc-700 disabled:opacity-40"
        >
          <Undo2 className="h-5 w-5" />
        </button>
        <button
          onClick={advance}
          aria-label="Otra persona"
          className="press flex h-14 w-14 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:border-zinc-300 hover:text-zinc-800"
        >
          <X className="h-7 w-7" />
        </button>
        <button
          onClick={openInfo}
          aria-label="Ver datos y comentarios"
          className="press flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-brand-600 shadow-sm transition hover:border-brand-300"
        >
          <Info className="h-5 w-5" />
        </button>
        <button
          onClick={() => recognize(current)}
          aria-label="La reconozco"
          className="press flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md transition hover:bg-emerald-600"
        >
          <Check className="h-7 w-7" />
        </button>
      </div>

      <p className="mt-3 text-center text-xs text-zinc-400">
        Toca la foto para ampliarla · Desliza{" "}
        <span className="font-semibold text-emerald-600">→ la reconozco</span> ·{" "}
        <span className="font-semibold text-zinc-500">← otra</span> · {index + 1} de{" "}
        {persons.length}
      </p>

      {/* Foto ampliada: tocar en cualquier lado la cierra. */}
      {photoOpen && (
        <div
          className="animate-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setPhotoOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Foto ampliada"
        >
          <button
            onClick={() => setPhotoOpen(false)}
            aria-label="Cerrar foto"
            className="press absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="animate-zoom max-h-[90dvh] w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl shadow-2xl">
              <PersonPhoto
                src={current.photoUrl}
                firstName={current.firstName}
                lastName={current.lastName}
                isUnidentified={current.isUnidentified}
                fallbackTextClass="text-7xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Datos + comentarios, sin salir de la baraja. */}
      <Modal open={infoOpen} onClose={() => setInfoOpen(false)} title={displayName} subtitle={PERSON_STATUS_LABEL[current.status]}>
        <div className="space-y-4">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-zinc-100">
            <PersonPhoto
              src={current.photoUrl}
              firstName={current.firstName}
              lastName={current.lastName}
              isUnidentified={current.isUnidentified}
              fallbackTextClass="text-6xl"
            />
          </div>
          {current.locationText && (
            <p className="flex items-center gap-1.5 text-sm text-zinc-600">
              <MapPin className="h-4 w-4 shrink-0 text-zinc-400" />
              {current.locationText}
              {current.estado ? `, ${current.estado}` : ""}
            </p>
          )}
          {current.description && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
              {current.description}
            </p>
          )}
          {comments === null ? (
            <p className="py-4 text-center text-sm text-zinc-400">Cargando comentarios…</p>
          ) : (
            <CommentSection
              entityType="person"
              entityId={current.id}
              initialComments={comments}
              title="Información de la comunidad"
              placeholder="¿La reconoces? ¿Sabes algo? Comparte de forma responsable."
            />
          )}
        </div>
      </Modal>
    </div>
  );
}

function DeckCard({
  person,
  behind = false,
  likeOpacity = 0,
  passOpacity = 0,
  style,
  ...handlers
}: {
  person: Person;
  behind?: boolean;
  likeOpacity?: number;
  passOpacity?: number;
  style?: React.CSSProperties;
} & React.HTMLAttributes<HTMLDivElement>) {
  const fullName = `${person.firstName} ${person.lastName}`.trim();
  const s = statusStyle(person.status);
  const meta = [person.age != null ? `${person.age} años` : null, person.gender]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      {...handlers}
      style={style}
      className={cn(
        "absolute inset-0 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100 shadow-xl",
        behind ? "scale-[0.96]" : "z-10 cursor-grab touch-none active:cursor-grabbing",
      )}
      aria-hidden={behind}
    >
      <PersonPhoto
        src={person.photoUrl}
        firstName={person.firstName}
        lastName={person.lastName}
        isUnidentified={person.isUnidentified}
        fallbackTextClass="text-7xl"
      />

      {/* Degradado para legibilidad del texto */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

      {/* Sellos al deslizar (solo la tarjeta de arriba) */}
      {!behind && (
        <>
          <div
            style={{ opacity: likeOpacity }}
            className="pointer-events-none absolute left-5 top-6 -rotate-12 rounded-xl border-4 border-emerald-400 px-3 py-1 text-xl font-extrabold tracking-wide text-emerald-400"
          >
            LA RECONOZCO
          </div>
          <div
            style={{ opacity: passOpacity }}
            className="pointer-events-none absolute right-5 top-6 rotate-12 rounded-xl border-4 border-white/80 px-3 py-1 text-xl font-extrabold tracking-wide text-white/90"
          >
            OTRA
          </div>
        </>
      )}

      {/* Información de la persona */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 text-white">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
            s.bg,
            s.text,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
          {PERSON_STATUS_LABEL[person.status]}
        </span>
        <h3 className="mt-2 text-2xl font-bold leading-tight drop-shadow">
          {fullName || "Persona sin identificar"}
        </h3>
        {meta && <p className="mt-0.5 text-sm capitalize text-white/85">{meta}</p>}
        {person.locationText && (
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-white/85">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">
              {person.locationText}
              {person.estado ? `, ${person.estado}` : ""}
            </span>
          </p>
        )}
        {person.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-white/75">{person.description}</p>
        )}
      </div>
    </div>
  );
}
