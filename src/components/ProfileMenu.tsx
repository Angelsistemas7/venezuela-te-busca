"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings, UserCircle2, UserRound } from "lucide-react";
import { getSessionUserAction, getMyProfileAction, signOutAction } from "@/app/actions";

type Session = { id: string; username: string; avatarUrl?: string | null } | null;

// Reemplaza el óvalo estático de "Fulano · Salir" por un menú desplegable con
// accesos directos: perfil, configuración, salir. Igual patrón que la
// campanita (NotificationBell): botón + panel flotante que se cierra al
// tocar afuera o con Escape.
export function ProfileMenu() {
  const router = useRouter();
  const [session, setSession] = useState<Session>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSessionUserAction()
      .then(async (u) => {
        if (!u) return setSession(null);
        try {
          const full = await getMyProfileAction();
          setSession({ id: u.id, username: u.username, avatarUrl: full?.avatarUrl ?? null });
        } catch {
          setSession(u);
        }
      })
      .catch(() => setSession(null));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function logout() {
    setOpen(false);
    await signOutAction();
    router.refresh();
    window.location.reload();
  }

  if (!session) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="press flex items-center gap-1.5 rounded-full bg-zinc-100 py-1 pl-1 pr-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-200"
      >
        {session.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <UserCircle2 className="h-7 w-7 text-zinc-500" />
        )}
        <span className="hidden max-w-[9rem] truncate sm:inline">{session.username}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1.5 shadow-xl">
          <Link
            href="/perfil"
            onClick={() => setOpen(false)}
            className="press flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <UserRound className="h-4 w-4 text-zinc-400" />
            Mi perfil
          </Link>
          <Link
            href="/configuracion"
            onClick={() => setOpen(false)}
            className="press flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <Settings className="h-4 w-4 text-zinc-400" />
            Configuración
          </Link>
          <div className="my-1 border-t border-zinc-100" />
          <button
            onClick={logout}
            className="press flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
