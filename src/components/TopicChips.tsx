import Link from "next/link";
import { HandHeart, LifeBuoy, Map, Users2 } from "lucide-react";

// Accesos rápidos a secciones reales del sitio. A diferencia de EstadoChips,
// no muestran un conteo: no existe hoy un sistema de temas/etiquetas con
// publicaciones asociadas, y mostrar un número inventado sería engañoso.
const TOPICS = [
  {
    href: "/comunidad?type=necesito",
    label: "Necesito ayuda",
    icon: LifeBuoy,
    tone: "bg-rose-50 text-rose-600",
  },
  {
    href: "/comunidad?type=ofrezco",
    label: "Ofrezco ayuda",
    icon: HandHeart,
    tone: "bg-emerald-50 text-emerald-600",
  },
  {
    href: "/voluntarios",
    label: "Voluntariado",
    icon: Users2,
    tone: "bg-violet-50 text-violet-600",
  },
  {
    href: "/mapa",
    label: "Mapa en vivo",
    icon: Map,
    tone: "bg-sky-50 text-sky-600",
  },
];

export function TopicChips() {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Temas destacados
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {TOPICS.map(({ href, label, icon: Icon, tone }) => (
          <Link
            key={href}
            href={href}
            className="press flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-4 text-center transition hover:border-brand-300 hover:shadow-sm"
          >
            <span className={`flex h-9 w-9 items-center justify-center rounded-full ${tone}`}>
              <Icon className="h-4.5 w-4.5" />
            </span>
            <span className="text-xs font-semibold text-zinc-700">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
