"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, HeartHandshake, Map, Search, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Barra de navegación inferior, solo en móvil: acceso con el pulgar a las
// secciones más usadas en la emergencia. El resto está en el menú superior.
const TABS = [
  { href: "/", label: "Se busca", icon: Search },
  { href: "/comunidad", label: "Comunidad", icon: Users2 },
  { href: "/hospitales", label: "Hospital", icon: Building2 },
  { href: "/ayuda", label: "Ayuda", icon: HeartHandshake },
  { href: "/mapa", label: "Mapa", icon: Map },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[3rem] flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition",
                  active ? "text-brand-700" : "text-zinc-500",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
