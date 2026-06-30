"use client";

// Almacén compartido en memoria de "lo que tengo guardado", para que TODOS los
// botones Guardar de la página conozcan su estado con UNA sola consulta (no una
// por botón). Vive mientras viva la pestaña; se carga al primer uso. Optimista:
// pinta el cambio al instante y revierte si el servidor lo rechaza.

import { getSavedKeysAction, setSavedAction } from "@/app/actions";
import type { SavedEntity } from "./types";

export const savedKey = (type: SavedEntity, id: string) => `${type}:${id}`;

const EMPTY: ReadonlySet<string> = new Set();
let cache: ReadonlySet<string> | null = null;
let loading: Promise<void> | null = null;
const subs = new Set<() => void>();

function emit() {
  for (const cb of subs) cb();
}

export function subscribe(cb: () => void): () => void {
  subs.add(cb);
  ensureLoaded();
  return () => {
    subs.delete(cb);
  };
}

export function getSnapshot(): ReadonlySet<string> {
  return cache ?? EMPTY;
}

export function getServerSnapshot(): ReadonlySet<string> {
  return EMPTY;
}

/** Carga el set de guardados una sola vez (al montar el primer botón). */
function ensureLoaded() {
  if (cache || loading) return;
  loading = getSavedKeysAction()
    .then((keys) => {
      cache = new Set(keys);
      emit();
    })
    .catch(() => {
      cache = new Set();
    })
    .finally(() => {
      loading = null;
    });
}

/**
 * Alterna el guardado de una publicación. Devuelve el resultado del servidor
 * para que el botón pueda, p. ej., abrir el login si no hay sesión.
 */
export async function toggleSaved(
  type: SavedEntity,
  id: string,
  title: string,
): Promise<{ ok: boolean; reason?: "auth" | "invalid" }> {
  const k = savedKey(type, id);
  const current = cache ?? new Set<string>();
  const willSave = !current.has(k);

  // Optimista: set nuevo (referencia distinta) para que React re-renderice.
  const next = new Set(current);
  if (willSave) next.add(k);
  else next.delete(k);
  cache = next;
  emit();

  const res = await setSavedAction(type, id, title, willSave);
  if (!res.ok) {
    // Revertir.
    const back = new Set(cache);
    if (willSave) back.delete(k);
    else back.add(k);
    cache = back;
    emit();
    return { ok: false, reason: res.reason };
  }
  return { ok: true };
}
