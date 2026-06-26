import type { Stats } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { AnimatedNumber } from "./AnimatedNumber";

function StatCard({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "amber" | "rose" | "emerald";
}) {
  const tones = {
    amber: "from-amber-50 to-white border-amber-200 text-amber-700",
    rose: "from-rose-50 to-white border-rose-200 text-rose-700",
    emerald: "from-emerald-50 to-white border-emerald-200 text-emerald-700",
  } as const;
  return (
    <div className={`rounded-2xl border bg-gradient-to-b p-3 text-center sm:p-5 ${tones[tone]}`}>
      <div className="text-xl font-bold tabular-nums sm:text-4xl">
        <AnimatedNumber value={value} />
      </div>
      <div className="mt-0.5 text-[11px] font-medium leading-tight text-zinc-600 sm:mt-1 sm:text-sm">
        {label}
      </div>
    </div>
  );
}

export function StatsBar({ stats }: { stats: Stats }) {
  return (
    <section>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard value={stats.registered} label="Personas registradas" tone="amber" />
        <StatCard value={stats.toLocate} label="Por localizar" tone="rose" />
        <StatCard value={stats.located} label="Localizadas" tone="emerald" />
      </div>
      <p className="mt-2 text-right text-xs text-zinc-400">
        Última actualización {formatDateTime(stats.lastUpdated)}
      </p>
    </section>
  );
}
