import Link from "next/link";
import { Search, Users2 } from "lucide-react";
import { getCommentsForEntities, getPosts } from "@/lib/data";
import { POST_TYPE_EMOJI, POST_TYPE_LABEL, type PostType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PostCard } from "@/components/PostCard";
import { CreatePostButton } from "@/components/CreatePostButton";
import { CommunityTabs } from "@/components/CommunityTabs";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const FILTERS: { value: PostType | "all"; label: string }[] = [
  { value: "all", label: "Todo" },
  ...(Object.keys(POST_TYPE_LABEL) as PostType[]).map((t) => ({
    value: t,
    label: `${POST_TYPE_EMOJI[t]} ${POST_TYPE_LABEL[t]}`,
  })),
];

export default async function ComunidadPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const type = (str(sp.type) as PostType | "all") ?? "all";
  const q = str(sp.q);

  const posts = await getPosts({ type, search: q });
  // Una sola consulta para los comentarios de todos los posts (evita el N+1).
  const commentsByPost = await getCommentsForEntities("post", posts.map((p) => p.id));
  const withComments = posts.map((p) => ({ post: p, comments: commentsByPost[p.id] ?? [] }));

  // Fijar arriba (cuando no hay filtro de tipo): primero las publicaciones
  // DESTACADAS por el equipo (avisos importantes), luego los rescates recientes.
  const RECENT_MS = 72 * 60 * 60 * 1000;
  const nowMs = Date.now();
  const featured = type === "all" ? withComments.filter((x) => x.post.pinned) : [];
  const featuredIds = new Set(featured.map((x) => x.post.id));
  const pinned =
    type === "all"
      ? withComments.filter(
          (x) =>
            !featuredIds.has(x.post.id) &&
            x.post.type === "rescate" &&
            nowMs - new Date(x.post.createdAt).getTime() < RECENT_MS,
        )
      : [];
  const pinnedIds = new Set([...featuredIds, ...pinned.map((x) => x.post.id)]);
  const rest = withComments.filter((x) => !pinnedIds.has(x.post.id));

  // Enlaces de tipo que conservan la búsqueda activa.
  const typeHref = (t: PostType | "all") => {
    const params = new URLSearchParams();
    if (t !== "all") params.set("type", t);
    if (q) params.set("q", q);
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
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar en el muro: necesidad, sector, nombre..."
            className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <button type="submit" className="rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800">
          Buscar
        </button>
      </form>

      {q && (
        <p className="mb-3 text-sm text-zinc-500">
          {withComments.length}{" "}
          {withComments.length === 1 ? "resultado" : "resultados"} para “{q}”.{" "}
          <Link href={type === "all" ? "/comunidad" : `/comunidad?type=${type}`} className="font-medium text-brand-700 hover:underline">
            Limpiar
          </Link>
        </p>
      )}

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={typeHref(f.value)}
            className={cn(
              "whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition",
              type === f.value
                ? "border-brand-400 bg-brand-50 text-brand-700"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {withComments.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="Aún no hay publicaciones aquí"
          description="Pide o ofrece ayuda, reporta un rescate o comparte información. Sé el primero."
        />
      ) : (
        <>
          {featured.length > 0 && (
            <section className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/50 p-3">
              <h2 className="mb-2 flex items-center gap-1.5 px-1 text-sm font-bold text-amber-700">
                <span>📌</span> Destacado
              </h2>
              <div className="space-y-4">
                {featured.map(({ post, comments }) => (
                  <PostCard key={post.id} post={post} comments={comments} />
                ))}
              </div>
            </section>
          )}

          {pinned.length > 0 && (
            <section className="mb-5 rounded-2xl border border-red-200 bg-red-50/40 p-3">
              <h2 className="mb-2 flex items-center gap-1.5 px-1 text-sm font-bold text-red-700">
                <span>🚨</span> Rescates activos
              </h2>
              <div className="space-y-4">
                {pinned.map(({ post, comments }) => (
                  <PostCard key={post.id} post={post} comments={comments} />
                ))}
              </div>
            </section>
          )}

          <div className="space-y-4">
            {rest.map(({ post, comments }) => (
              <PostCard key={post.id} post={post} comments={comments} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
