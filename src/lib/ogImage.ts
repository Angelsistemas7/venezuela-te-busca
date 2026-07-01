import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { isSafePhotoUrl } from "./validation";

// El renderizador de ImageResponse (satori, usado por next/og) no decodifica
// WebP —formato en el que `compressImage` sube las fotos—, así que una foto
// remota en ese formato queda en blanco al compartir, sin avisar del error.
// Se descarga y se convierte a JPEG con `sharp` antes de incrustarla.
//
// Esta es la única función del código que hace un `fetch()` server-side sobre
// una URL guardada por un usuario (`photoUrl`). Aunque ya se valida al
// guardarla (`isSafePhotoUrl` en actions.ts), se revalida aquí también por si
// quedó algún registro viejo sin ese chequeo: sin esto, esta ruta pública
// (se llama sola al compartir el enlace en WhatsApp/Telegram) sería un SSRF
// contra cualquier host que alguien haya podido colar como "foto".
const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // mismo tope que la subida (upload.ts)

export async function toEmbeddablePhoto(url: string): Promise<string | null> {
  if (!isSafePhotoUrl(url)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const len = res.headers.get("content-length");
    if (len && Number(len) > MAX_PHOTO_BYTES) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > MAX_PHOTO_BYTES) return null;
    const jpeg = await sharp(buf).jpeg({ quality: 85 }).toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function getLogoDataUrl(): Promise<string> {
  const logo = await readFile(join(process.cwd(), "public", "logo.png"));
  return `data:image/png;base64,${logo.toString("base64")}`;
}

// Línea que aparece bajo el llamado a la acción en las tarjetas de compartir:
// contexto de la plataforma sin alargar demasiado el texto.
export const PLATFORM_BLURB =
  "Iniciativa de El Mundo Te Busca, plataforma ciudadana sin fines de lucro: personas desaparecidas, mascotas, puntos de ayuda, hospitales, voluntariado, mapa en vivo.";
