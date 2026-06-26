import Link from "next/link";
import { ArrowRight, Baby, Clock, HeartPulse, PersonStanding, Sparkles } from "lucide-react";
import { getPersons } from "@/lib/data";
import { PersonCard } from "./PersonCard";

// Secciones curadas del inicio: agrupan a las personas por categorías de alta
// prioridad para que ninguna quede enterrada bajo miles de registros.

type SectionDef = {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  query: Parameters<typeof getPersons>[0];
};

const SECTIONS: SectionDef[] = [
  {
    key: "recientes",
    title: "Registrados recientemente",
    subtitle: "Los últimos casos publicados por la comunidad",
    icon: Clock,
    href: "/?sort=recent",
    query: { sort: "recent", pageSize: 6 },
  },
  {
    key: "ninos",
    title: "Niñas, niños y adolescentes",
    subtitle: "Menores de 18 años por localizar — máxima prioridad",
    icon: Baby,
    href: "/?status=por_localizar&maxAge=17",
    query: { status: "por_localizar", maxAge: 17, sort: "recent", pageSize: 6 },
  },
  {
    key: "mayores",
    title: "Adultos mayores",
    subtitle: "60 años o más por localizar",
    icon: PersonStanding,
    href: "/?status=por_localizar&minAge=60",
    query: { status: "por_localizar", minAge: 60, sort: "recent", pageSize: 6 },
  },
  {
    key: "localizados",
    title: "Recién localizados",
    subtitle: "Buenas noticias: personas que ya aparecieron",
    icon: HeartPulse,
    href: "/?status=localizado",
    query: { status: "localizado", sort: "recent", pageSize: 6 },
  },
];

async function Section({ def }: { def: SectionDef }) {
  const { items } = await getPersons({ ...def.query, excludeUnidentified: true });
  if (items.length === 0) return null;
  const Icon = def.icon;

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <Icon className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="font-bold text-zinc-900">{def.title}</h2>
            <p className="text-xs text-zinc-500">{def.subtitle}</p>
          </div>
        </div>
        <Link
          href={def.href}
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
        >
          Ver todos
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((person) => (
          <PersonCard key={person.id} person={person} />
        ))}
      </div>
    </section>
  );
}

export async function FeaturedSections() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
        <Sparkles className="h-4 w-4" />
        Secciones destacadas
      </div>
      {SECTIONS.map((def) => (
        <Section key={def.key} def={def} />
      ))}
    </div>
  );
}
