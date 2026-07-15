import { NextResponse } from "next/server";
import { getVerifiedNews, getWorldPress } from "@/lib/news";

// Endpoint interno para "calentar" la caché de noticias (src/lib/news.ts) desde
// un cron del VPS, en vez de dejar que la llene la primera visita real del día
// (esa persona esperaría a que responda GDELT/GNews, que pueden tardar varios
// segundos). La caché vive en la memoria del propio proceso de Next — por eso
// esto tiene que ser una ruta DENTRO de la app (no un script aparte): un
// script standalone calentaría la memoria de OTRO proceso que nadie lee.
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const provided = new URL(request.url).searchParams.get("secret");
    if (provided !== expected) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }
  }

  const [verified] = await Promise.all([getVerifiedNews(10), getWorldPress(10)]);
  return NextResponse.json({ ok: true, verifiedCount: verified.length });
}
