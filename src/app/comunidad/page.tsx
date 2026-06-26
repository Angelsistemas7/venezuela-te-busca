import Link from "next/link";
import { Users2 } from "lucide-react";
import { getComments, getPosts } from "@/lib/data";
import { POST_TYPE_EMOJI, POST_TYPE_LABEL, type PostType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PostCard } from "@/components/PostCard";
import { CreatePostButton } from "@/components/CreatePostButton";

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

  const posts = await getPosts({ type });
  const withComments = await Promise.all(
    posts.map(async (p) => ({ post: p, comments: await getComments("post", p.id) })),
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
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

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/comunidad" : `/comunidad?type=${f.value}`}
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
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center text-zinc-500">
          Aún no hay publicaciones de este tipo. Sé el primero en publicar.
        </div>
      ) : (
        <div className="space-y-4">
          {withComments.map(({ post, comments }) => (
            <PostCard key={post.id} post={post} comments={comments} />
          ))}
        </div>
      )}
    </div>
  );
}
