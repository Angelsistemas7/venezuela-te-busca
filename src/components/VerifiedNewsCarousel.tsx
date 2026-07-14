import { ShieldCheck } from "lucide-react";
import { getWorldPress } from "@/lib/news";
import { NewsCarouselTrack, type CarouselItem } from "./NewsCarouselTrack";

// Trae noticias reales y vigentes (Google News, cacheado 30 min en getWorldPress)
// en vez de una lista fija: así el carrusel no requiere curar contenido a mano
// ni corre el riesgo de mostrar una fuente o URL inventada.
export async function VerifiedNewsCarousel() {
  const articles = await getWorldPress(10);
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
      <h2 className="flex items-center gap-2 text-lg font-bold text-navy-700">
        Noticias verificadas
        <span className="flex items-center gap-1 text-xs font-medium text-zinc-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          Información real, de fuentes confiables
        </span>
      </h2>
      <div className="mt-4">
        <NewsCarouselTrack items={items} />
      </div>
    </section>
  );
}
