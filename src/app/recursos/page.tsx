import { ExternalLink, Info, LayoutGrid } from "lucide-react";
import { RECURSOS } from "@/lib/recursos";

export const metadata = {
  title: "Otras plataformas y recursos — Venezuela te busca",
  description:
    "Directorio de plataformas e iniciativas de terceros en la respuesta al terremoto: búsqueda de personas, donaciones, apoyo psicosocial, mapas y organismos oficiales.",
};

export default function RecursosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
          <LayoutGrid className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Otras plataformas y recursos
          </h1>
          <p className="mt-1 text-zinc-500">
            Otras iniciativas de la respuesta al terremoto: búsqueda de personas, donaciones, apoyo
            psicosocial y más. Somos un <strong>puente</strong>: cada plataforma es independiente.
          </p>
        </div>
      </div>

      <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Estos enlaces llevan a sitios de terceros. <strong>Verifica siempre</strong> la información
          antes de donar o actuar; no respondemos por plataformas ajenas.
        </p>
      </div>

      <div className="space-y-8">
        {RECURSOS.map((grupo) => (
          <section key={grupo.categoria}>
            <h2 className="mb-3 flex items-center gap-2 font-bold text-zinc-900">
              <span>{grupo.emoji}</span>
              {grupo.categoria}
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-600">
                {grupo.items.length}
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {grupo.items.map((r) => {
                const inner = (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-zinc-900">{r.name}</span>
                      {r.url && <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-zinc-300 group-hover:text-brand-600" />}
                    </div>
                    <p className="mt-1 text-sm text-zinc-600">{r.description}</p>
                    {r.note && <p className="mt-1.5 text-xs text-zinc-400">{r.note}</p>}
                  </>
                );
                return r.url ? (
                  <a
                    key={r.name}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-card group rounded-2xl border border-zinc-200 bg-white p-4"
                  >
                    {inner}
                  </a>
                ) : (
                  <div key={r.name} className="rounded-2xl border border-zinc-200 bg-white p-4">
                    {inner}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-zinc-400">
        ¿Conoces una iniciativa verificable que falte aquí? Escríbenos y la evaluamos.
      </p>
    </div>
  );
}
