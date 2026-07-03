"use client";

// Comprime y redimensiona una imagen en el navegador ANTES de subirla.
// Una foto de ~2–5 MB baja a ~100–250 KB en WebP, sin pérdida visible. Esto
// reduce drásticamente el costo de almacenamiento y de ancho de banda.
//
// Efecto de seguridad IMPORTANTE (no accidental, a propósito): dibujar la
// imagen en un <canvas> y re-exportarla borra TODOS los metadatos EXIF —
// incluida la coordenada GPS exacta donde se tomó la foto, que la cámara del
// teléfono guarda ahí sin que la persona lo note. Por eso esta función SIEMPRE
// devuelve la versión recomprimida cuando el navegador pudo procesarla, aunque
// pese un poco más que el original — nunca hay que devolver el archivo
// original tal cual si ya se pudo re-codificar, o se perdería esa limpieza.
export async function compressImage(
  file: File,
  { maxDim = 1280, quality = 0.82 }: { maxDim?: number; quality?: number } = {},
): Promise<File> {
  // Si no es imagen o el navegador no soporta canvas, no hay forma de limpiar
  // metadatos aquí — se sube el original (caso raro: navegador muy viejo).
  if (!file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality),
    );
    if (!blob) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], name, { type: "image/webp" });
  } catch {
    return file;
  }
}
