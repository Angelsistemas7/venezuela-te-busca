import Link from "next/link";
import type { DashboardStats as Stats } from "@/lib/data";
import { QUAKE_INFO } from "@/lib/geo";
import { AnimatedNumber } from "./AnimatedNumber";

type Tone = "rose" | "amber" | "emerald" | "sky" | "violet" | "zinc";

const TONES: Record<Tone, string> = {
  rose: "from-rose-50 to-white border-rose-200 text-rose-700",
  amber: "from-amber-50 to-white border-amber-200 text-amber-700",
  emerald: "from-emerald-50 to-white border-emerald-200 text-emerald-700",
  sky: "from-sky-50 to-white border-sky-200 text-sky-700",
  violet: "from-violet-50 to-white border-violet-200 text-violet-700",
  zinc: "from-zinc-50 to-white border-zinc-200 text-zinc-700",
};

// Cada cifra es un enlace a su filtro o sección correspondiente. En móvil son
// tarjetas compactas dentro de un carrusel horizontal (deslizar); en pantallas
// grandes forman una rejilla de 8. El ancho fijo en móvil deja ver ~3,5 a la
// vez, lo que insinúa que hay más al deslizar.
function Card({ value, label, tone, href }: { value: number; label: string; tone: Tone; href: string }) {
  return (
    <Link
      href={href}
      className={`tap-card block w-[27%] shrink-0 snap-start rounded-2xl border bg-gradient-to-b p-2.5 text-center sm:w-auto sm:p-3 ${TONES[tone]}`}
    >
      <div className="text-xl font-bold tabular-nums sm:text-3xl">
        <AnimatedNumber value={value} />
      </div>
      <div className="mt-0.5 text-[10px] font-medium leading-tight text-zinc-600 sm:text-xs">{label}</div>
    </Link>
  );
}

export function DashboardStats({ stats }: { stats: Stats }) {
  return (
    <section>
      <div className="stagger no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-3 sm:overflow-visible sm:px-0 lg:grid-cols-8">
        <Card value={stats.desaparecidos} label="Desaparecidos" tone="rose" href="/?status=por_localizar" />
        <Card value={stats.enHospitales} label="En hospitales" tone="amber" href="/?status=hospitalizado" />
        <Card value={stats.aSalvo} label="A salvo" tone="emerald" href="/?status=localizado" />
        <Card value={stats.ninos} label="Niños" tone="sky" href="/?maxAge=11" />
        <Card value={stats.fallecidos} label="Fallecidos" tone="zinc" href="/?status=fallecido" />
        <Card value={stats.denuncias} label="Denuncias" tone="violet" href="/denuncias" />
        <Card value={stats.necesidades} label="Necesidades" tone="amber" href="/comunidad?type=necesito" />
        <Card value={stats.voluntarios} label="Ofrecen ayuda" tone="emerald" href="/voluntarios" />
      </div>

      {/* Cifras del sismo: caja pequeña debajo (compacta también en móvil). */}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-600">
        <span className="font-semibold text-zinc-700">Sismo (preliminar):</span>
        <span>
          M <strong>{QUAKE_INFO.magnitude}</strong>
        </span>
        <span>
          Heridos <strong>+{QUAKE_INFO.injured.toLocaleString("es-VE")}</strong>
        </span>
        <span>
          Fallecidos <strong>{QUAKE_INFO.deaths.toLocaleString("es-VE")}</strong>
        </span>
        <span className="text-[10px] text-zinc-400">Fuentes: {QUAKE_INFO.sourceName}</span>
      </div>
    </section>
  );
}
