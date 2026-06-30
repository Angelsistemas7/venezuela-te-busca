import { ExternalLink } from "lucide-react";

// Historias destacadas con foto, elegidas a mano. Cada una enlaza a su fuente
// original (medios reconocidos). No son contenido editable: van fijas aquí.
type Featured = {
  image: string;
  source: string;
  title: string;
  url: string;
};

const FEATURED: Featured[] = [
  {
    image: "/noticias/perros-rescatistas.webp",
    source: "Vistazo",
    title: "Héroes de cuatro patas: Furbo y Hades, canes rescatistas enviados a Venezuela",
    url: "https://www.vistazo.com/tendencias/mascotas/perros/2026-06-25-heroes-cuatro-patas-furbo-hades-canes-rescatistas-quito-enviados-venezuela-buscar-sobrevivientes-CI11083032",
  },
  {
    image: "/noticias/rescate-bebe.avif",
    source: "Vanguardia",
    title: "El milagro entre las ruinas: los rescates que emocionan tras los terremotos en Venezuela",
    url: "https://www.vanguardia.com/mundo/2026/06/26/el-milagro-entre-las-ruinas-los-rescates-que-emocionan-tras-los-terremotos-en-venezuela/",
  },
  {
    image: "/noticias/vecinos-voluntarios.jpg",
    source: "Kienyke",
    title: "Vecinos y voluntarios mantienen viva la esperanza tras los terremotos en Venezuela",
    url: "https://www.kienyke.com/mundo/vecinos-y-voluntarios-mantienen-viva-la-esperanza-tras-los-terremotos-en-venezuela",
  },
];

export function FeaturedNews() {
  return (
    <section className="mb-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Historias destacadas
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {FEATURED.map((f) => (
          <a
            key={f.url}
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:border-zinc-300 hover:shadow-sm"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.image}
                alt=""
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <span className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-0.5 text-[11px] font-semibold text-white">
                {f.source}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-3">
              <p className="flex-1 text-sm font-semibold leading-snug text-zinc-800">{f.title}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-700">
                Ver fuente
                <ExternalLink className="h-3.5 w-3.5" />
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
