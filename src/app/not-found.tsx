import Link from "next/link";
import { Home, MapPinOff, Search } from "lucide-react";

// 404 con estilo de la app: enlaces inválidos, fichas de persona inexistentes,
// caravanas/puntos que ya no están, etc.
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
        <MapPinOff className="h-7 w-7" />
      </span>
      <h1 className="mt-5 text-xl font-bold text-zinc-900">No encontramos esta página</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
        Es posible que el enlace haya cambiado o que el registro ya no esté disponible.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-brand-300"
        >
          <Home className="h-4 w-4" />
          Ir al inicio
        </Link>
        <Link
          href="/comunidad"
          className="flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          <Search className="h-4 w-4" />
          Ir a la comunidad
        </Link>
      </div>
    </div>
  );
}
