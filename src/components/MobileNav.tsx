"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, HeartHandshake, LifeBuoy, Map, Newspaper, PawPrint, Search, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Barra de navegación inferior, solo en móvil: mismas secciones que el menú
// superior, con íconos, para acceso con el pulgar. Comunidad agrupa voluntarios,
// caravanas y denuncias (se resalta en todas ellas).
const COMMUNITY_PATHS = ["/comunidad", "/voluntarios", "/caravanas", "/denuncias"];

const TABS = [
  { href: "/", label: "Se busca", icon: Search },
  { href: "/comunidad", label: "Comunidad", icon: Users2 },
  { href: "/noticias", label: "Noticias", icon: Newspaper },
  { href: "/hospitales", label: "Hospital", icon: Building2 },
  { href: "/ayuda", label: "Ayuda", icon: HeartHandshake },
  { href: "/mascotas", label: "Mascotas", icon: PawPrint },
  { href: "/emergencias", label: "SOS", icon: LifeBuoy },
  { href: "/mapa", label: "Mapa", icon: Map },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-xl items-stretch justify-around">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : href === "/comunidad"
                ? COMMUNITY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
                : pathname.startsWith(href);
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[3rem] flex-col items-center justify-center gap-0.5 px-0.5 py-2 text-[10px] font-medium leading-none transition",
                  active ? "text-brand-700" : "text-zinc-500",
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", active && "stroke-[2.5]")} />
                <span className="w-full truncate text-center">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
