import { HandHeart, Info, Newspaper, Star } from "lucide-react";
import { getCommentsForEntities, getHeroes } from "@/lib/data";
import { getHumanitarianUpdates, getLatestNews } from "@/lib/news";
import { NewsList } from "@/components/NewsList";
import { HeroCard } from "@/components/HeroCard";
import { ProposeHeroButton } from "@/components/ProposeHeroButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Noticias y ayuda humanitaria — Venezuela te busca",
  description:
    "Últimas noticias del sismo de Venezuela, ayuda humanitaria internacional y héroes de la emergencia, con su fuente. Información en vivo de ReliefWeb (ONU/OCHA) y prensa (GDELT).",
};

export default async function NoticiasPage() {
  const [humanitarian, latest, heroes] = await Promise.all([
    getHumanitarianUpdates(10),
    getLatestNews(14),
    getHeroes(),
  ]);
  const heroComments = await getCommentsForEntities("hero", heroes.map((h) => h.id));

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
            Información <strong>en vivo</strong> sobre el sismo de Venezuela. Cada entrada conserva su
            <strong> fuente original</strong> y enlaza a ella. Filtramos automáticamente para mostrar
            solo lo relacionado con Venezuela.
          </p>
        </div>
      </div>

      <div className="mb-6 flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Esta sección recoge prensa y reportes oficiales de fuentes externas; por eso es de solo
          lectura y no se publica aquí. Si una fuente no carga, vuelve a intentarlo más tarde.
        </p>
      </div>

      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-zinc-900">
              <Star className="h-5 w-5 text-amber-500" />
              Héroes de la emergencia
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Reconocimiento a quienes ayudan: bomberos, rescatistas, perros de búsqueda, personal de
              salud y donantes. Cualquiera puede proponer uno; un moderador lo verifica.
            </p>
          </div>
          <ProposeHeroButton />
        </div>
        {heroes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-6 text-center text-sm text-zinc-500">
            Aún no hay héroes publicados. ¿Conoces a alguien que merece reconocimiento? Propónlo.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {heroes.map((h) => (
              <HeroCard key={h.id} hero={h} comments={heroComments[h.id] ?? []} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-bold text-zinc-900">
            <HandHeart className="h-5 w-5 text-emerald-500" />
            Ayuda humanitaria internacional
          </h2>
          <span className="text-xs text-zinc-400">Fuente: ReliefWeb · ONU/OCHA</span>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Respuesta humanitaria que llegó, va en camino o fue anunciada, según reportes oficiales.
        </p>
        <div className="mt-3">
          <NewsList
            articles={humanitarian}
            emptyText="No hay reportes de ReliefWeb disponibles ahora mismo. Intenta de nuevo más tarde."
          />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-bold text-zinc-900">
            <Newspaper className="h-5 w-5 text-rose-500" />
            Últimas noticias
          </h2>
          <span className="text-xs text-zinc-400">Fuente: prensa (GDELT)</span>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Titulares recientes de medios de todo el mundo sobre el sismo de Venezuela.
        </p>
        <div className="mt-3">
          <NewsList
            articles={latest}
            emptyText="No hay titulares disponibles ahora mismo. Intenta de nuevo más tarde."
          />
        </div>
      </section>

    </div>
  );
}
