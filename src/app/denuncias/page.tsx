import Link from "next/link";
import { Megaphone, Search, ShieldAlert } from "lucide-react";
import { getCommentsForEntities, getComplaints } from "@/lib/data";
import {
  COMPLAINT_CATEGORY_EMOJI,
  COMPLAINT_CATEGORY_LABEL,
  type ComplaintCategory,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { ComplaintCard } from "@/components/ComplaintCard";
import { DenunciaButton } from "@/components/DenunciaButton";
import { CommunityTabs } from "@/components/CommunityTabs";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const FILTERS: { value: ComplaintCategory | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  ...(Object.keys(COMPLAINT_CATEGORY_LABEL) as ComplaintCategory[]).map((c) => ({
    value: c,
    label: `${COMPLAINT_CATEGORY_EMOJI[c]} ${COMPLAINT_CATEGORY_LABEL[c]}`,
  })),
];

export default async function DenunciasPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const category = (str(sp.cat) as ComplaintCategory | "all") ?? "all";
  const q = str(sp.q);

  const complaints = await getComplaints({ category, search: q });
  const commentsByComplaint = await getCommentsForEntities("complaint", complaints.map((c) => c.id));

  const catHref = (c: ComplaintCategory | "all") => {
    const params = new URLSearchParams();
    if (c !== "all") params.set("cat", c);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/denuncias?${qs}` : "/denuncias";
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <CommunityTabs />
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white">
            <Megaphone className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Denuncias</h1>
            <p className="mt-1 text-zinc-500">
              Reporta irregularidades: desvío o robo de ayuda, riesgo a la niñez, fraude o abuso de
              autoridad. La comunidad ve y apoya cada reporte.
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <DenunciaButton />
        </div>
      </div>

      {/* Aviso de uso responsable */}
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div>
          <p className="font-bold">Antes de publicar, por favor:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            <li>Denuncia solo irregularidades <strong>reales y verificables</strong>.</li>
            <li>Aporta datos concretos: qué pasó, dónde y cuándo. Agrega foto y ubicación si puedes.</li>
            <li>
              <strong>No señales a una persona con nombre o foto si no tienes pruebas</strong>: una
              acusación falsa puede dañar a un inocente y traerte problemas legales.
            </li>
            <li>Publicar requiere <strong>iniciar sesión</strong> (no es anónimo ante el sistema).</li>
            <li>Si hay un menor en riesgo o un delito en curso, <strong>llama también al 911</strong>.</li>
          </ul>
        </div>
      </div>

      <form action="/denuncias" className="mb-3 flex gap-2">
        {category !== "all" && <input type="hidden" name="cat" value={category} />}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar en denuncias: zona, tipo, palabra..."
            className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-base outline-none sm:text-sm focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          />
        </div>
        <button type="submit" className="rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800">
          Buscar
        </button>
      </form>

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={catHref(f.value)}
            className={cn(
              "whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition",
              category === f.value
                ? "border-rose-300 bg-rose-50 text-rose-700"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {complaints.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No hay denuncias de este tipo"
          description="Si detectas una irregularidad real (desvío de ayuda, riesgo a la niñez…), repórtala con responsabilidad."
        />
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => (
            <ComplaintCard key={c.id} complaint={c} comments={commentsByComplaint[c.id] ?? []} />
          ))}
        </div>
      )}
    </div>
  );
}
