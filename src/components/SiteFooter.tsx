import Link from "next/link";

const EMERGENCY = [
  { num: "911", label: "Movistar" },
  { num: "112", label: "Digitel" },
  { num: "*1", label: "Movilnet" },
  { num: "171", label: "CANTV fijo" },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-zinc-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🇻🇪</span>
            <span className="text-lg font-bold text-zinc-900">Venezuela te busca</span>
          </div>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-600">
            Iniciativa ciudadana, voluntaria y sin fines de lucro para ayudar a localizar a las
            personas desaparecidas y coordinar ayuda tras el terremoto de 2026.
          </p>
          <p className="mt-3 max-w-md text-xs leading-relaxed text-zinc-500">
            No vendemos ni compartimos tu información con terceros y solo la usamos para ayudar a
            localizar personas. Los datos que se publican son responsabilidad de quien los envía;
            verifícalos antes de difundirlos.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-900">Teléfonos de emergencia</h3>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {EMERGENCY.map((e) => (
              <li
                key={e.num}
                className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2"
              >
                <span className="text-lg font-bold text-rose-600">{e.num}</span>
                <span className="text-xs text-zinc-500">{e.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-zinc-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 text-xs text-zinc-400">
          <span>© 2026 Venezuela te busca · Iniciativa sin fines de lucro</span>
          <Link href="/admin" className="hover:text-zinc-700">
            Panel de moderación
          </Link>
        </div>
      </div>
    </footer>
  );
}
