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

function Card({ value, label, tone }: { value: number; label: string; tone: Tone }) {
  return (
    <div className={`rounded-2xl border bg-gradient-to-b p-3 text-center ${TONES[tone]}`}>
      <div className="text-2xl font-bold tabular-nums sm:text-3xl">
        <AnimatedNumber value={value} />
      </div>
      <div className="mt-0.5 text-[11px] font-medium leading-tight text-zinc-600 sm:text-xs">{label}</div>
    </div>
  );
}

export function DashboardStats({ stats }: { stats: Stats }) {
  return (
    <section>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-8 sm:gap-3">
        <Card value={stats.desaparecidos} label="Desaparecidos" tone="rose" />
        <Card value={stats.enHospitales} label="En hospitales" tone="amber" />
        <Card value={stats.aSalvo} label="A salvo" tone="emerald" />
        <Card value={stats.ninos} label="Niños" tone="sky" />
        <Card value={stats.fallecidos} label="Fallecidos" tone="zinc" />
        <Card value={stats.denuncias} label="Denuncias" tone="violet" />
        <Card value={stats.necesidades} label="Necesidades" tone="amber" />
        <Card value={stats.voluntarios} label="Ofrecen ayuda" tone="emerald" />
      </div>

      {/* Cifras del sismo (fuentes públicas, preliminar) */}
      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-600">
        <span className="font-semibold text-zinc-700">Cifras del sismo (preliminar):</span>
        <span>
          Magnitud <strong>M {QUAKE_INFO.magnitude}</strong>
        </span>
        <span>
          Heridos <strong>+{QUAKE_INFO.injured.toLocaleString("es-VE")}</strong>
        </span>
        <span>
          Fallecidos <strong>{QUAKE_INFO.deaths.toLocaleString("es-VE")}</strong>
        </span>
        <span className="text-xs text-zinc-400">Fuentes: {QUAKE_INFO.sourceName}</span>
      </div>
    </section>
  );
}
