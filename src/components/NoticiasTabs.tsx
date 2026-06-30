"use client";

import { useState } from "react";
import { Activity, HandHeart, Newspaper, Star } from "lucide-react";
import type { Comment, Hero, NewsItem } from "@/lib/types";
import type { NewsArticle } from "@/lib/news";
import type { Quake } from "@/lib/usgs";
import { cn } from "@/lib/utils";
import { HeroCard } from "./HeroCard";
import { ProposeHeroButton } from "./ProposeHeroButton";
import { NewsItemCard } from "./NewsItemCard";
import { AddNewsItemButton } from "./AddNewsItemButton";
import { NewsList } from "./NewsList";
import { RecentQuakes } from "./RecentQuakes";

type TabKey = "heroes" | "ayuda" | "noticias" | "sismos";

const TABS: { key: TabKey; label: string; icon: typeof Star }[] = [
  { key: "heroes", label: "Héroes", icon: Star },
  { key: "ayuda", label: "Ayuda humanitaria", icon: HandHeart },
  { key: "noticias", label: "Últimas noticias", icon: Newspaper },
  { key: "sismos", label: "Sismos", icon: Activity },
];

export function NoticiasTabs({
  heroes,
  heroComments,
  humanitarian,
  latest,
  quakes,
  curatedAyuda,
  curatedNoticia,
  newsComments,
  isAdmin,
}: {
  heroes: Hero[];
  heroComments: Record<string, Comment[]>;
  humanitarian: NewsArticle[];
  latest: NewsArticle[];
  quakes: Quake[];
  curatedAyuda: NewsItem[];
  curatedNoticia: NewsItem[];
  newsComments: Record<string, Comment[]>;
  isAdmin: boolean;
}) {
  const [tab, setTab] = useState<TabKey>("heroes");

  return (
    <>
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition",
                active
                  ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>

      <div key={tab} className="animate-fade-in">
      {tab === "heroes" && (
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-500">
              Reconocimiento a quienes ayudan: bomberos, rescatistas, perros de búsqueda, personal de
              salud y donantes. Cualquiera puede proponer uno; un moderador lo verifica.
            </p>
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
      )}

      {tab === "ayuda" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-zinc-500">
              Respuesta humanitaria que llegó, va en camino o fue anunciada. Cada entrada cita su fuente.
            </p>
            {isAdmin && <AddNewsItemButton kind="ayuda" />}
          </div>

          {curatedAyuda.length > 0 && (
            <div className="space-y-4">
              {curatedAyuda.map((n) => (
                <NewsItemCard key={n.id} item={n} comments={newsComments[n.id] ?? []} isAdmin={isAdmin} />
              ))}
            </div>
          )}

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-bold text-zinc-900">
                <HandHeart className="h-5 w-5 text-emerald-500" />
                En vivo: reportes oficiales
              </h2>
              <span className="text-xs text-zinc-400">Fuente: ReliefWeb · ONU/OCHA</span>
            </div>
            <div className="mt-3">
              <NewsList
                articles={humanitarian}
                emptyText="No hay reportes de ReliefWeb disponibles ahora mismo. Intenta de nuevo más tarde."
              />
            </div>
          </div>
        </section>
      )}

      {tab === "noticias" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-zinc-500">
              Titulares sobre el sismo de Venezuela. Cada entrada cita su fuente.
            </p>
            {isAdmin && <AddNewsItemButton kind="noticia" />}
          </div>

          {curatedNoticia.length > 0 && (
            <div className="space-y-4">
              {curatedNoticia.map((n) => (
                <NewsItemCard key={n.id} item={n} comments={newsComments[n.id] ?? []} isAdmin={isAdmin} />
              ))}
            </div>
          )}

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-bold text-zinc-900">
                <Newspaper className="h-5 w-5 text-rose-500" />
                En vivo: prensa mundial
              </h2>
              <span className="text-xs text-zinc-400">Fuente: Google Noticias</span>
            </div>
            <div className="mt-3">
              <NewsList
                articles={latest}
                emptyText="No hay titulares disponibles ahora mismo. Intenta de nuevo más tarde."
              />
            </div>
          </div>
        </section>
      )}

      {tab === "sismos" && (
        <section>
          <RecentQuakes quakes={quakes} />
        </section>
      )}
      </div>
    </>
  );
}
