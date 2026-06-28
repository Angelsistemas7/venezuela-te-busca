"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, HeartHandshake, LifeBuoy, Map, Newspaper, PawPrint, Search, Users2 } from "lucide-react";
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
];

// Sub-secciones que viven bajo la pestaña "Comunidad" (se resaltan con ella).
const COMMUNITY_PATHS = ["/comunidad", "/voluntarios", "/caravanas", "/denuncias"];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-400 text-lg font-bold text-zinc-900">
            VE
          </span>
          <span className="text-base font-bold tracking-tight text-zinc-900 sm:text-lg">
            Venezuela te busca
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <nav className="no-scrollbar hidden items-center gap-1 overflow-x-auto md:flex">
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
