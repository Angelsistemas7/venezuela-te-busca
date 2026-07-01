import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

// El renderizador de ImageResponse (satori, usado por next/og) no decodifica
// WebP —formato en el que `compressImage` sube las fotos—, así que una foto
// remota en ese formato queda en blanco al compartir, sin avisar del error.
// Se descarga y se convierte a JPEG con `sharp` antes de incrustarla.
export async function toEmbeddablePhoto(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
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
