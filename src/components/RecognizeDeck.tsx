"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Info, MapPin, RotateCcw, Search, Trash2, Undo2, Users, X } from "lucide-react";
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
//
// Persistencia: quién ya viste ("no lo conozco" / "la reconozco") se guarda
// por DISPOSITIVO en localStorage (mismo patrón que los votos/"me gusta" del
// resto del sitio, sin necesitar sesión) — así no vuelve a aparecer la misma
// persona al recargar, volver con el botón "atrás" del navegador, o entrar de
// nuevo más tarde. Sin esto, todo vivía solo en memoria del componente: al
// desmontarse (p. ej. al navegar a la ficha de alguien y volver) se perdía y
// la baraja empezaba de cero mostrando otra vez a quien ya se había pasado.

const THRESHOLD = 110;
const TAP_SLOP = 6; // movimiento máximo (px) para que cuente como toque, no arrastre
const DECISION_KEY = (id: string) => `vtb_recognize_${id}`;
type Decision = "pass" | "recognized";

export function RecognizeDeck({ persons }: { persons: Person[] }) {
  const router = useRouter();
  const [decided, setDecided] = useState<Map<string, Decision>>(new Map());
  const [ready, setReady] = useState(false);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [photoOpen, setPhotoOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [recognizedOpen, setRecognizedOpen] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]); // ids decididos en esta sesión, para poder deshacer
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const draggedRef = useRef(false);

  // Carga las decisiones ya guardadas en este dispositivo (solo se puede leer
  // localStorage en el cliente, de ahí el useEffect en vez de useState directo).
  useEffect(() => {
    const map = new Map<string, Decision>();
    for (const p of persons) {
      const v = localStorage.getItem(DECISION_KEY(p.id));
      if (v === "pass" || v === "recognized") map.set(p.id, v);
    }
    setDecided(map);
    setReady(true);
  }, [persons]);

  const queue = useMemo(() => persons.filter((p) => !decided.has(p.id)), [persons, decided]);
  const recognizedList = useMemo(
    () => persons.filter((p) => decided.get(p.id) === "recognized"),
    [persons, decided],
  );

  const current = queue[0];
  const upcoming = queue[1];

  function decide(id: string, decision: Decision) {
    localStorage.setItem(DECISION_KEY(id), decision);
    setHistory((prev) => [...prev, id]);
    setDecided((prev) => {
      const next = new Map(prev);
      next.set(id, decision);
      return next;
    });
  }

  const advance = useCallback(() => {
    setDrag({ x: 0, y: 0, active: false });
    startRef.current = null;
    if (current) decide(current.id, "pass");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const undo = useCallback(() => {
    setDrag({ x: 0, y: 0, active: false });
    startRef.current = null;
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const lastId = prev[prev.length - 1];
      localStorage.removeItem(DECISION_KEY(lastId));
      setDecided((d) => {
        const next = new Map(d);
        next.delete(lastId);
        return next;
      });
      return prev.slice(0, -1);
    });
  }, []);

  function resetAll() {
    for (const p of persons) localStorage.removeItem(DECISION_KEY(p.id));
    setDecided(new Map());
    setHistory([]);
    setDrag({ x: 0, y: 0, active: false });
  }

  function forgetRecognized(id: string) {
    localStorage.removeItem(DECISION_KEY(id));
    setDecided((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
    setHistory((prev) => prev.filter((h) => h !== id));
  }

  const recognize = useCallback(
    (p: Person | undefined) => {
      if (!p) return;
      decide(p.id, "recognized");
      router.push(`/persona/${p.id}`);
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

  // Evita mostrar un instante la primera persona sin filtrar (antes de leer
  // localStorage) para luego saltar a la que corresponde de verdad.
  if (!ready) {
    return <div className="mx-auto h-[54dvh] max-h-[560px] min-h-[380px] w-full max-w-sm" />;
  }

  // Fin de la baraja (de este lote). Las decisiones quedan guardadas en este
  // dispositivo: recargar o volver con "atrás" no las repite.
  if (!current) {
    return (
      <div className="mx-auto max-w-sm rounded-3xl border border-zinc-200 bg-white p-8 text-center">
        <Check className="mx-auto h-9 w-9 text-emerald-500" />
        <h3 className="mt-3 font-bold text-zinc-900">Revisaste a todas</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Gracias por mirar. Si reconociste a alguien, entra en su ficha y deja la información.
        </p>
        {recognizedList.length > 0 && (
          <button
            onClick={() => setRecognizedOpen(true)}
            className="press mx-auto mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:underline"
          >
            <Users className="h-4 w-4" />
            Ver a quienes reconociste ({recognizedList.length})
          </button>
        )}
        <button
          onClick={resetAll}
          className="press mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          <RotateCcw className="h-4 w-4" />
          Volver a empezar
        </button>
        <RecognizedModal
          open={recognizedOpen}
          onClose={() => setRecognizedOpen(false)}
          persons={recognizedList}
          onForget={forgetRecognized}
        />
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
      {recognizedList.length > 0 && (
        <div className="mb-3 flex justify-end">
          <button
            onClick={() => setRecognizedOpen(true)}
            className="press flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
          >
            <Users className="h-3.5 w-3.5" />
            Reconocidos ({recognizedList.length})
          </button>
        </div>
      )}
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
          disabled={history.length === 0}
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
        <span className="font-semibold text-zinc-500">← otra</span> · quedan {queue.length}
      </p>

      <RecognizedModal
        open={recognizedOpen}
        onClose={() => setRecognizedOpen(false)}
        persons={recognizedList}
        onForget={forgetRecognized}
      />

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

// Lista de personas marcadas "la reconozco" en este dispositivo (guardada en
// localStorage, no requiere sesión). Permite volver a su ficha o quitarlas de
// la lista si fue un toque accidental.
function RecognizedModal({
  open,
  onClose,
  persons,
  onForget,
}: {
  open: boolean;
  onClose: () => void;
  persons: Person[];
  onForget: (id: string) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="A quienes reconociste" subtitle="Guardado en este dispositivo">
      {persons.length === 0 ? (
        <p className="py-4 text-center text-sm text-zinc-400">Todavía no has marcado a nadie.</p>
      ) : (
        <ul className="space-y-2">
          {persons.map((p) => {
            const fullName = `${p.firstName} ${p.lastName}`.trim() || "Persona sin identificar";
            return (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-xl border border-zinc-200 p-2.5"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                  <PersonPhoto
                    src={p.photoUrl}
                    firstName={p.firstName}
                    lastName={p.lastName}
                    isUnidentified={p.isUnidentified}
                    fallbackTextClass="text-lg"
                  />
                </div>
                <Link href={`/persona/${p.id}`} onClick={onClose} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-900">{fullName}</p>
                  <p className="truncate text-xs text-zinc-500">{PERSON_STATUS_LABEL[p.status]}</p>
                </Link>
                <button
                  onClick={() => onForget(p.id)}
                  aria-label="Quitar de reconocidos"
                  className="press flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
