"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, HeartHandshake, LayoutGrid, LifeBuoy, Map, Newspaper, PawPrint, Search, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "./NotificationBell";
import { AuthMenu } from "./AuthMenu";

const NAV = [
  { href: "/", label: "Se busca", icon: Search },
  { href: "/comunidad", label: "Comunidad", icon: Users2 },
  { href: "/noticias", label: "Noticias", icon: Newspaper },
  { href: "/hospitales", label: "Hospitales", icon: Building2 },
  { href: "/ayuda", label: "Puntos de ayuda", icon: HeartHandshake },
  { href: "/mascotas", label: "Mascotas", icon: PawPrint },
  { href: "/emergencias", label: "Emergencias", icon: LifeBuoy },
  { href: "/mapa", label: "Mapa", icon: Map },
  { href: "/recursos", label: "Recursos", icon: LayoutGrid },
];

// Sub-secciones que viven bajo la pestaña "Comunidad" (se resaltan con ella).
const COMMUNITY_PATHS = ["/comunidad", "/voluntarios", "/caravanas", "/denuncias"];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="El Mundo Te Busca" className="h-10 w-10 shrink-0 object-contain" />
          {/* "El Mundo" encima de "Te Busca": compacto y no se estira en una línea larga.
              whitespace-nowrap evita que, si el header se aprieta, cada palabra caiga en su
              propia línea (pasaba porque el Link podía encogerse por debajo del ancho del texto). */}
          <span className="flex flex-col font-bold leading-[1.05] tracking-tight text-zinc-900">
            <span className="whitespace-nowrap text-sm sm:text-base">El Mundo</span>
            <span className="whitespace-nowrap text-sm sm:text-base">Te Busca</span>
          </span>
        </Link>

        <div className="flex min-w-0 items-center gap-2">
          <nav className="no-scrollbar hidden min-w-0 items-center gap-1 overflow-x-auto md:flex">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : href === "/comunidad"
                  ? COMMUNITY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
                  : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition",
                  active
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            );
          })}
          </nav>
          <NotificationBell />
          <AuthMenu />
        </div>
      </div>
    </header>
  );
}
