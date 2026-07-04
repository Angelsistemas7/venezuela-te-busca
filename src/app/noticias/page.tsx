import { Newspaper } from "lucide-react";
import { getCommentsForEntities, getHeroes, getNewsItems } from "@/lib/data";
import { getHumanitarianUpdates, getWorldPress } from "@/lib/news";
import { getRecentQuakes } from "@/lib/usgs";
import { isAdmin } from "@/lib/admin";
import { NoticiasTabs } from "@/components/NoticiasTabs";
import { FeaturedNews } from "@/components/FeaturedNews";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Noticias y ayuda humanitaria — El Mundo Te Busca",
  description:
    "Héroes de la emergencia, ayuda humanitaria internacional, últimas noticias y sismos recientes del terremoto de Venezuela, con su fuente.",
};

export default async function NoticiasPage() {
  const [humanitarian, latest, heroes, quakes, curatedAyuda, curatedNoticia, admin] = await Promise.all([
    getHumanitarianUpdates(10),
    getWorldPress(14),
    getHeroes(),
    getRecentQuakes(),
    // Si la tabla aún no existe (esquema sin migrar), no rompemos la página.
    getNewsItems("ayuda").catch(() => []),
    getNewsItems("noticia").catch(() => []),
    isAdmin(),
  ]);
  // Independientes entre sí: en paralelo en vez de una detrás de otra.
  const [heroComments, newsComments] = await Promise.all([
    getCommentsForEntities("hero", heroes.map((h) => h.id)),
    getCommentsForEntities("news_item", [...curatedAyuda, ...curatedNoticia].map((n) => n.id)),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
          <Newspaper className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Noticias y ayuda humanitaria
          </h1>
          <p className="mt-1 text-zinc-500">
            Héroes de la emergencia, ayuda internacional, últimos titulares y sismos recientes. Cada
            entrada conserva su <strong>fuente</strong>. Cambia de sección con los botones de abajo.
          </p>
        </div>
      </div>

      <FeaturedNews />

      <NoticiasTabs
        heroes={heroes}
        heroComments={heroComments}
        humanitarian={humanitarian}
        latest={latest}
        quakes={quakes}
        curatedAyuda={curatedAyuda}
        curatedNoticia={curatedNoticia}
        newsComments={newsComments}
        isAdmin={admin}
      />
    </div>
  );
}
