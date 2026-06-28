import Link from "next/link";
import { ShareWhatsApp } from "./ShareWhatsApp";

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
          <h3 className="text-sm font-semibold text-zinc-900">Emergencias</h3>
          <a
            href="tel:911"
            className="mt-3 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 transition hover:bg-rose-100"
          >
            <span className="text-3xl font-extrabold leading-none text-rose-600">911</span>
            <span className="text-xs leading-relaxed text-zinc-600">
              <span className="font-semibold text-zinc-800">Línea única nacional (VEN 9‑1‑1).</span>{" "}
              Policía, bomberos, Protección Civil y ambulancias. Funciona desde cualquier teléfono,
              las 24 horas.
            </span>
          </a>
          <Link
            href="/emergencias"
            className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline"
          >
            Más teléfonos y guía de seguridad →
          </Link>

          <p className="mt-4 text-sm font-medium text-zinc-700">
            Ayúdanos a difundir: entre más personas vean esta página, más personas pueden estar a salvo.
          </p>
          <div className="mt-2">
            <ShareWhatsApp variant="subtle" />
          </div>
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
