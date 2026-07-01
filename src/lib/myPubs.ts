"use client";

// "Cuenta ligera" sin registro: el navegador recuerda QUÉ publicó este
// dispositivo y su token de gestión, para que el autor no pierda el control y
// pueda recibir avisos de actividad. Todo vive en localStorage; el token sigue
// siendo el secreto que da el control (igual que el enlace de gestión).

export type MyPubType = "person" | "post" | "aid_point" | "march" | "pet";

export interface MyPub {
  type: MyPubType;
  id: string;
  token: string;
  title: string;
  createdAt: string; // ISO
}

export type Counts = { comments: number; reports: number };
type SeenMap = Record<string, Counts>;

const PUBS_KEY = "vtb_my_pubs";
const SEEN_KEY = "vtb_pub_seen";

/** Clave estable por publicación (evita choques de id entre tipos). */
export const activityKey = (type: MyPubType, id: string) => `${type}:${id}`;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* almacenamiento lleno o bloqueado: no es crítico */
  }
}

export function getMyPubs(): MyPub[] {
  return read<MyPub[]>(PUBS_KEY, []);
}

/** Registra una publicación propia (idempotente por tipo+id). */
export function addMyPub(pub: MyPub) {
  const rest = getMyPubs().filter((p) => !(p.type === pub.type && p.id === pub.id));
  write(PUBS_KEY, [pub, ...rest].slice(0, 100));

  // Línea base: lo que exista al publicar no debe contar como "nuevo".
  const seen = getSeen();
  const k = activityKey(pub.type, pub.id);
  if (!seen[k]) {
    seen[k] = { comments: 0, reports: 0 };
    write(SEEN_KEY, seen);
  }
}

export function removeMyPub(type: MyPubType, id: string) {
  write(
    PUBS_KEY,
    getMyPubs().filter((p) => !(p.type === type && p.id === id)),
  );
}

export function getSeen(): SeenMap {
  return read<SeenMap>(SEEN_KEY, {});
}

/** Marca como visto el conteo actual de cada publicación. */
export function markSeen(activity: SeenMap) {
  const seen = getSeen();
  for (const [key, val] of Object.entries(activity)) seen[key] = val;
  write(SEEN_KEY, seen);
}

/** Enlace privado de gestión según el tipo. */
export function managePath(type: MyPubType, id: string, token: string): string {
  const base =
    type === "person"
      ? "/persona"
      : type === "post"
        ? "/comunidad"
        : type === "aid_point"
          ? "/ayuda"
          : type === "pet"
            ? "/mascotas"
            : "/caravanas";
  // Con cuenta no hace falta token: la sesión demuestra la propiedad.
  return token ? `${base}/${id}/gestion?token=${token}` : `${base}/${id}/gestion`;
}
