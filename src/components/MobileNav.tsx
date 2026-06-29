"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  HeartHandshake,
  LayoutGrid,
  LifeBuoy,
  Map,
  Menu,
  Newspaper,
  PawPrint,
  Search,
  Users2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Barra inferior (solo móvil): 4 secciones clave de la emergencia con el pulgar
// + un botón "Más" que abre una hoja con el resto. Más legible que apretar 8.
const COMMUNITY_PATHS = ["/comunidad", "/voluntarios", "/caravanas", "/denuncias"];

const PRIMARY = [
  { href: "/", label: "Se busca", icon: Search },
  { href: "/comunidad", label: "Comunidad", icon: Users2 },
  { href: "/mapa", label: "Mapa", icon: Map },
  { href: "/emergencias", label: "SOS", icon: LifeBuoy },
];

const MORE = [
  { href: "/noticias", label: "Noticias", icon: Newspaper },
  { href: "/hospitales", label: "Hospitales", icon: Building2 },
  { href: "/ayuda", label: "Puntos de ayuda", icon: HeartHandshake },
  { href: "/mascotas", label: "Mascotas", icon: PawPrint },
  { href: "/recursos", label: "Recursos", icon: LayoutGrid },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/comunidad") {
    return COMMUNITY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  }
  return pathname.startsWith(href);
}

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE.some((t) => isActive(pathname, t.href));

  return (
    <>
      {moreOpen && (
        <div
          className="animate-backdrop fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="animate-sheet absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-zinc-200 bg-white p-3 pb-24"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="text-sm font-bold text-zinc-900">Más secciones</span>
              <button onClick={() => setMoreOpen(false)} aria-label="Cerrar" className="press rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MORE.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "tap-card flex items-center gap-2.5 rounded-xl border px-3 py-3 text-sm font-medium",
                      active ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-700",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur md:hidden">
        <ul className="mx-auto flex max-w-md items-stretch justify-around">
          {PRIMARY.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href} className="min-w-0 flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "press flex min-h-[3rem] flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium leading-none transition",
                    active ? "text-brand-700" : "text-zinc-500",
                  )}
                >
                  <Icon className={cn("h-5 w-5 shrink-0", active && "stroke-[2.5]")} />
                  <span className="w-full truncate text-center">{label}</span>
                </Link>
              </li>
            );
          })}
          <li className="min-w-0 flex-1">
            <button
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              className={cn(
                "press flex min-h-[3rem] w-full flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium leading-none transition",
                moreOpen || moreActive ? "text-brand-700" : "text-zinc-500",
              )}
            >
              <Menu className={cn("h-5 w-5 shrink-0", (moreOpen || moreActive) && "stroke-[2.5]")} />
              <span className="w-full truncate text-center">Más</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
