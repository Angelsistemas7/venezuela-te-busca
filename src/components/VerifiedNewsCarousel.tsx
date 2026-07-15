import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { getGdeltNews, getWorldPress } from "@/lib/news";
import { NewsCarouselTrack, type CarouselItem } from "./NewsCarouselTrack";

// Trae noticias reales y vigentes en vez de una lista fija: así el carrusel
// no requiere curar contenido a mano ni corre el riesgo de mostrar una fuente
// o URL inventada. GDELT va primero porque trae foto real de portada
// (`socialimage`) y enlace directo al artículo; Google Noticias no trae foto
// en su feed, así que solo se usa para completar si GDELT da pocos resultados
// (caído, con límite de peticiones, etc.).
export async function VerifiedNewsCarousel() {
  const gdelt = await getGdeltNews(10);
  let articles = gdelt;
  if (articles.length < 4) {
    const fallback = await getWorldPress(10);
    const seen = new Set(articles.map((a) => a.url));
    articles = [...articles, ...fallback.filter((a) => !seen.has(a.url))].slice(0, 10);
  }
  if (articles.length === 0) return null;

  const items: CarouselItem[] = articles.map((a) => ({
    id: a.id,
    image: a.image,
    source: a.source,
    title: a.title,
    url: a.url,
  }));

  return (
    <section className="reveal-up rounded-3xl border-2 border-navy-700 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold text-navy-700">
          Noticias verificadas
          <span className="flex items-center gap-1 text-xs font-medium text-zinc-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Información real, de fuentes confiables
          </span>
        </h2>
        <Link href="/noticias" className="press text-sm font-medium text-brand-700 hover:underline">
          Ver todas →
        </Link>
      </div>
      <div className="mt-4">
        <NewsCarouselTrack items={items} />
      </div>
    </section>
  );
}
