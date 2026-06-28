import Link from "next/link";
import { HandHeart, Mail, MapPin, Phone, Search } from "lucide-react";
import { getVolunteers } from "@/lib/data";
import { VOLUNTEER_TYPE_EMOJI, VOLUNTEER_TYPE_LABEL, type VolunteerType } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { RegisterVolunteerButton } from "@/components/RegisterVolunteerButton";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const FILTERS: { value: VolunteerType | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  ...(Object.keys(VOLUNTEER_TYPE_LABEL) as VolunteerType[]).map((t) => ({
    value: t,
    label: `${VOLUNTEER_TYPE_EMOJI[t]} ${VOLUNTEER_TYPE_LABEL[t]}`,
  })),
];

export default async function VoluntariosPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const type = (str(sp.type) as VolunteerType | "all") ?? "all";
  const q = str(sp.q);

  const volunteers = await getVolunteers({ type, search: q });

  const typeHref = (t: VolunteerType | "all") => {
    const params = new URLSearchParams();
    if (t !== "all") params.set("type", t);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/voluntarios?${qs}` : "/voluntarios";
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <HandHeart className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Voluntarios</h1>
            <p className="mt-1 text-zinc-500">
              Personas que ofrecen su tiempo y conocimiento: médicos, rescatistas, conductores,
              traductores y más. Ofrécete o encuentra a quien pueda ayudar.
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <RegisterVolunteerButton />
        </div>
      </div>

      <form action="/voluntarios" className="mb-3 flex gap-2">
        {type !== "all" && <input type="hidden" name="type" value={type} />}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nombre, ciudad o habilidad..."
            className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
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
            href={typeHref(f.value)}
            className={cn(
              "whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition",
              type === f.value
                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {volunteers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center text-zinc-500">
          Aún no hay voluntarios de este tipo. Sé el primero en ofrecerte.
        </div>
      ) : (
        <ul className="space-y-3">
          {volunteers.map((v) => (
            <li key={v.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  {VOLUNTEER_TYPE_EMOJI[v.type]} {VOLUNTEER_TYPE_LABEL[v.type]}
                </span>
                <span className="font-semibold text-zinc-900">{v.name}</span>
                <span className="ml-auto text-xs text-zinc-400">{timeAgo(v.createdAt)}</span>
              </div>

              {v.skillsText && <p className="mt-2 text-sm text-zinc-600">{v.skillsText}</p>}

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
                {v.availabilityText && (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                    {v.availabilityText}
                  </span>
                )}
                {(v.locationText || v.estado) && (
                  <span className="inline-flex items-center gap-1 text-xs">
                    <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                    {[v.locationText, v.estado].filter(Boolean).join(", ")}
                  </span>
                )}
                {v.contactPhone && (
                  <a href={`tel:${v.contactPhone}`} className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
                    <Phone className="h-3.5 w-3.5" />
                    {v.contactPhone}
                  </a>
                )}
                {v.contactEmail && (
                  <a href={`mailto:${v.contactEmail}`} className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
                    <Mail className="h-3.5 w-3.5" />
                    {v.contactEmail}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
