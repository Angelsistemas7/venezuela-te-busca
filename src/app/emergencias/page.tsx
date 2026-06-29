import Link from "next/link";
import { ChevronRight, LayoutGrid, LifeBuoy, Phone, ShieldCheck } from "lucide-react";
import { COMMUNITY_GUIDE, NATIONAL_LINE, PHONE_GROUPS } from "@/lib/emergency";
import { ShareWhatsApp } from "@/components/ShareWhatsApp";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Emergencia y seguridad",
  description: "Teléfonos de emergencia, guía rápida para la comunidad y cómo difundir la página.",
};

export default function EmergenciasPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white">
          <LifeBuoy className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Emergencia y seguridad
          </h1>
          <p className="mt-1 text-zinc-500">
            Teléfonos útiles, qué hacer en las primeras horas y cómo ayudar a difundir.
          </p>
        </div>
      </div>

      {/* Línea única nacional */}
      <a
        href={`tel:${NATIONAL_LINE.number}`}
        className="flex items-center gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 transition hover:bg-rose-100"
      >
        <span className="text-4xl font-extrabold leading-none text-rose-600 sm:text-5xl">
          {NATIONAL_LINE.number}
        </span>
        <span className="text-sm leading-relaxed text-zinc-700">
          <span className="font-semibold text-zinc-900">{NATIONAL_LINE.label}.</span> Policía,
          bomberos, Protección Civil y ambulancias. Desde cualquier teléfono, 24 horas.
        </span>
      </a>

      {/* Compartir */}
      <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
        <p className="text-sm font-medium text-emerald-900">
          Entre más personas vean esta página, más personas pueden estar a salvo. Compártela:
        </p>
        <div className="mt-3">
          <ShareWhatsApp />
        </div>
      </div>

      {/* Directorio de plataformas externas */}
      <Link
        href="/recursos"
        className="tap-card mt-5 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-4"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
          <LayoutGrid className="h-5 w-5" />
        </span>
        <span className="flex-1">
          <span className="block font-semibold text-zinc-900">Otras plataformas y recursos</span>
          <span className="block text-sm text-zinc-500">
            Iniciativas de terceros: búsqueda de personas, donaciones, apoyo psicosocial y más.
          </span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-zinc-400" />
      </Link>

      {/* Directorios de teléfonos */}
      {PHONE_GROUPS.map((group) => (
        <section key={group.title} className="mt-6">
          <h2 className="flex items-center gap-2 font-bold text-zinc-900">
            <Phone className="h-4.5 w-4.5 text-zinc-500" />
            {group.title}
          </h2>
          {group.note && <p className="mt-0.5 text-xs text-zinc-500">{group.note}</p>}
          <ul className="mt-3 divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            {group.entries.map((e) => (
              <li key={e.name} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <span className="text-sm font-medium text-zinc-800">{e.name}</span>
                <span className="flex flex-wrap gap-2">
                  {e.phones.map((p) => (
                    <a
                      key={p}
                      href={`tel:${p.replace(/[^+\d]/g, "")}`}
                      className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-zinc-200"
                    >
                      {p}
                    </a>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="mt-3 text-xs text-zinc-400">
        Los teléfonos por organismo son de referencia y pueden cambiar. Ante una emergencia médica o
        de rescate, llama siempre a los organismos oficiales (911).
      </p>

      {/* Guía rápida para la comunidad */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 font-bold text-zinc-900">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          Guía rápida para la comunidad
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Acciones esenciales en las primeras horas. Compártelas con tus vecinos y grupos de chat.
        </p>
        <ol className="mt-3 space-y-2">
          {COMMUNITY_GUIDE.map((step, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">
                {i + 1}
              </span>
              <span className="text-sm text-zinc-700">{step}</span>
            </li>
          ))}
        </ol>
        <div className="mt-4">
          <ShareWhatsApp />
        </div>
      </section>
    </div>
  );
}
