import Link from "next/link";
import { HeartHandshake, MapPinned, ShieldCheck, Users2 } from "lucide-react";
import { getAidPoints, getDashboardStats, getStats } from "@/lib/data";
import { formatDateTime } from "@/lib/utils";
import { AnimatedNumber } from "./AnimatedNumber";

function StatRow({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: typeof Users2;
  value: number;
  label: string;
  tone: "brand" | "emerald" | "violet" | "sky";
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-700",
    emerald: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
    sky: "bg-sky-50 text-sky-700",
  } as const;
  return (
    <div className="flex items-center gap-3">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}>
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div>
        <div className="text-lg font-bold tabular-nums leading-tight text-navy-700">
          <AnimatedNumber value={value} />
        </div>
        <div className="text-xs leading-tight text-zinc-500">{label}</div>
      </div>
    </div>
  );
}

export async function HomeHero() {
  const [stats, dashboardStats, aidPoints] = await Promise.all([
    getStats(),
    getDashboardStats(),
    getAidPoints(),
  ]);

  return (
    <section className="reveal-up relative overflow-hidden rounded-3xl border-2 border-navy-700 bg-white">
      {/* Fondo ilustrado: sin foto (no hay una con derechos de uso todavía),
          formas suaves en los colores de marca más el corazón del logo como
          marca de agua, para que el hero no se sienta vacío. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-100" />
        <div className="absolute -bottom-32 right-10 h-64 w-64 rounded-full bg-brand-50" />
        <svg
          className="absolute -right-10 top-1/2 h-[22rem] w-[22rem] -translate-y-1/2 text-navy-700/[0.05]"
          viewBox="0 0 1080 1080"
          fill="currentColor"
        >
          <path d="M540,940 C260,760 90,560 90,360 C90,220 200,110 340,110 C420,110 490,150 540,220 C590,150 660,110 740,110 C880,110 990,220 990,360 C990,560 820,760 540,940 Z" />
        </svg>
      </div>

      <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_320px] lg:gap-8">
        <div className="flex flex-col justify-center">
          <h1 className="font-heading text-3xl font-bold leading-[1.1] tracking-tight text-navy-700 sm:text-4xl lg:text-[2.75rem]">
            Cuando el mundo se detiene,{" "}
            <span className="text-brand-500">la solidaridad nos encuentra.</span>
          </h1>
          <p className="mt-4 max-w-xl text-zinc-600">
            Plataforma ciudadana de ayuda y búsqueda tras el terremoto en Venezuela 2026.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/comunidad"
              className="press rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
            >
              ¿Cómo puedo ayudar?
            </Link>
            <Link
              href="/mapa"
              className="press flex items-center gap-2 rounded-full border border-navy-700 bg-white px-5 py-2.5 text-sm font-semibold text-navy-700 transition hover:bg-navy-50"
            >
              Ver mapa EN VIVO
              <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white/90 p-5 backdrop-blur-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-navy-700">
            Juntos somos más fuertes
          </h2>
          <div className="mt-4 flex flex-col gap-4">
            <StatRow icon={Users2} value={stats.registered} label="Personas buscadas" tone="sky" />
            <StatRow icon={ShieldCheck} value={stats.located} label="Reportes verificados" tone="emerald" />
            <StatRow
              icon={HeartHandshake}
              value={dashboardStats.voluntarios}
              label="Voluntarios activos"
              tone="violet"
            />
            <StatRow icon={MapPinned} value={aidPoints.length} label="Puntos de ayuda" tone="brand" />
          </div>
          <p className="mt-4 text-right text-xs text-zinc-400">
            Actualizado {formatDateTime(stats.lastUpdated)}
          </p>
        </div>
      </div>
    </section>
  );
}
