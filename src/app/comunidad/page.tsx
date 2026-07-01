import Link from "next/link";
import { Search, Users2 } from "lucide-react";
import { getCommentsForEntities, getPosts, getPostsPage, type PostSort } from "@/lib/data";
import { POST_TYPE_EMOJI, POST_TYPE_LABEL, type PostType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CreatePostButton } from "@/components/CreatePostButton";
import { CommunityTabs } from "@/components/CommunityTabs";
import { EmptyState } from "@/components/EmptyState";
import { PinnedPostCard } from "@/components/PinnedPostCard";
import { PostCard } from "@/components/PostCard";
import { Pagination } from "@/components/Pagination";
import { PageSizeSelect, clampPageSize } from "@/components/PageSizeSelect";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v: string | string[] | undefined) => {
  const s = str(v);
  const n = s ? Number(s) : NaN;
  return Number.isFinite(n) ? n : undefined;
};

const FILTERS: { value: PostType | "all"; label: string }[] = [
  { value: "all", label: "Todo" },
  ...(Object.keys(POST_TYPE_LABEL) as PostType[]).map((t) => ({
    value: t,
    label: `${POST_TYPE_EMOJI[t]} ${POST_TYPE_LABEL[t]}`,
  })),
];

const SORTS: { value: PostSort; label: string }[] = [
  { value: "recent", label: "Recientes" },
  { value: "popular", label: "Más apoyadas" },
  { value: "oldest", label: "Más antiguas" },
];

export default async function ComunidadPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const type = (str(sp.type) as PostType | "all") ?? "all";
  const q = str(sp.q);
  const sort = (str(sp.sort) as PostSort) ?? "recent";
  const page = num(sp.page) ?? 1;
  const pageSize = clampPageSize(num(sp.pageSize));

  // Destacados (fijados por el equipo) y rescates activos (últimas 72h): se ven
  // SIEMPRE arriba, en una fila que se desliza de lado — antes se apilaban uno
  // debajo del otro y había que bajar mucho para llegar al muro normal.
  const RECENT_MS = 72 * 60 * 60 * 1000;
  const nowMs = Date.now();
  const [featuredPosts, rescuePosts, pageResult] = await Promise.all([
    type === "all" ? getPosts({ pinnedOnly: true, search: q }) : Promise.resolve([]),
    type === "all" ? getPosts({ type: "rescate", search: q }) : Promise.resolve([]),
    // Antes: hasta 100 publicaciones completas en cada visita, sin límite —
    // pasados los 100 posts no había forma de ver algo más antiguo. Ahora
    // pagina de verdad (10/20/50 a elegir), con orden real en la base de datos.
    getPostsPage({ type, search: q }, page, pageSize, sort),
  ]);
  const featured = featuredPosts;
  const featuredIds = new Set(featured.map((p) => p.id));
  const pinned = rescuePosts.filter(
    (p) => !featuredIds.has(p.id) && nowMs - new Date(p.createdAt).getTime() < RECENT_MS,
  );
  const pinnedIds = new Set([...featuredIds, ...pinned.map((p) => p.id)]);
  // El muro no repite lo que ya se muestra fijo arriba.
  const restPosts = pageResult.items.filter((p) => !pinnedIds.has(p.id));

  const allShown = [...featured, ...pinned, ...restPosts];
  // Una sola consulta para los comentarios de todo lo que se ve en esta carga (evita el N+1).
  const commentsByPost = await getCommentsForEntities("post", allShown.map((p) => p.id));
  const withComments = (posts: typeof allShown) => posts.map((post) => ({ ...post, comments: commentsByPost[post.id] ?? [] }));

  // Enlaces que conservan la búsqueda/orden/tamaño activos al cambiar el otro
  // filtro. Cambiar tipo u orden siempre vuelve a la página 1.
  const buildHref = (overrides: { type?: PostType | "all"; sort?: PostSort }) => {
    const params = new URLSearchParams();
    const t = overrides.type ?? type;
    const s = overrides.sort ?? sort;
    if (t !== "all") params.set("type", t);
    if (s !== "recent") params.set("sort", s);
    if (q) params.set("q", q);
    if (pageSize !== 10) params.set("pageSize", String(pageSize));
    const qs = params.toString();
    return qs ? `/comunidad?${qs}` : "/comunidad";
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <CommunityTabs />
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-400 text-zinc-900">
            <Users2 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Comunidad</h1>
            <p className="mt-1 text-zinc-500">
              El muro de la emergencia: pide y ofrece ayuda, reporta rescates, convoca caravanas y
              mantén a todos informados. Toda información cuenta.
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <CreatePostButton />
        </div>
      </div>

      <form action="/comunidad" className="mb-3 flex gap-2">
        {type !== "all" && <input type="hidden" name="type" value={type} />}
        {sort !== "recent" && <input type="hidden" name="sort" value={sort} />}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar en el muro: necesidad, sector, nombre..."
            className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <button type="submit" className="press rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800">
          Buscar
        </button>
      </form>

      {q && (
        <p className="mb-3 text-sm text-zinc-500">
          {pageResult.total} {pageResult.total === 1 ? "resultado" : "resultados"} para “{q}”.{" "}
          <Link href={buildHref({})} className="font-medium text-brand-700 hover:underline">
            Limpiar
          </Link>
        </p>
      )}

      <div className="no-scrollbar hint-swipe mb-3 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={buildHref({ type: f.value })}
            className={cn(
              "press whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition",
              type === f.value
                ? "border-brand-400 bg-brand-50 text-brand-700"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Orden: recientes, más apoyadas (por reacciones) o más antiguas. */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1 text-sm">
          <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-400">Ordenar</span>
          {SORTS.map((s) => (
            <Link
              key={s.value}
              href={buildHref({ sort: s.value })}
              className={cn(
                "press shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition",
                sort === s.value
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300",
              )}
            >
              {s.label}
            </Link>
          ))}
        </div>
        <PageSizeSelect value={pageSize} />
      </div>

      {allShown.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="Aún no hay publicaciones aquí"
          description="Pide o ofrece ayuda, reporta un rescate o comparte información. Sé el primero."
        />
      ) : (
        <>
          {featured.length > 0 && (
            <section className="mb-5">
              <h2 className="mb-2 flex items-center gap-1.5 px-1 text-sm font-bold text-amber-700">
                <span>📌</span> Destacado
              </h2>
              <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
                {withComments(featured).map((post) => (
                  <PinnedPostCard key={post.id} post={post} comments={post.comments} tone="amber" />
                ))}
              </div>
            </section>
          )}

          {pinned.length > 0 && (
            <section className="mb-5">
              <h2 className="mb-2 flex items-center gap-1.5 px-1 text-sm font-bold text-red-700">
                <span>🚨</span> Rescates activos
              </h2>
              <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
                {withComments(pinned).map((post) => (
                  <PinnedPostCard key={post.id} post={post} comments={post.comments} tone="red" />
                ))}
              </div>
            </section>
          )}

          {restPosts.length > 0 && (
            <div className="animate-rise space-y-4">
              {withComments(restPosts).map((post) => (
                <PostCard key={post.id} post={post} comments={post.comments} />
              ))}
            </div>
          )}

          <div className="mt-6">
            <Pagination page={pageResult.page} pageSize={pageResult.pageSize} total={pageResult.total} />
          </div>
        </>
      )}
    </div>
  );
}
