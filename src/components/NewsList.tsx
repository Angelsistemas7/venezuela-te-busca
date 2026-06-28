import { ExternalLink } from "lucide-react";
import type { NewsArticle } from "@/lib/news";
import { timeAgo } from "@/lib/utils";

// Lista de artículos en vivo (solo lectura). Cada uno enlaza a su fuente
// original y muestra el medio y la hora. No se edita ni se vota: es prensa
// externa que se actualiza sola.
export function NewsList({
  articles,
  emptyText = "No hay artículos disponibles ahora mismo. Intenta de nuevo más tarde.",
}: {
  articles: NewsArticle[];
  emptyText?: string;
}) {
  if (articles.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-6 text-center text-sm text-zinc-500">
        {emptyText}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-100">
      {articles.map((a) => (
        <li key={a.id} className="py-3">
          <a
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3"
          >
            {a.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.image}
                alt=""
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
                loading="lazy"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-800 group-hover:text-brand-700">
                {a.title}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-zinc-400">
                <span className="font-semibold text-zinc-500">{a.source}</span>
                {a.publishedAt && <span>· {timeAgo(a.publishedAt)}</span>}
              </p>
            </div>
            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-zinc-300 group-hover:text-zinc-600" />
          </a>
        </li>
      ))}
    </ul>
  );
}
