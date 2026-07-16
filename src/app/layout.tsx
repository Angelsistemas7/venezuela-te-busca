import type { Metadata, Viewport } from "next";
import { Figtree, Signika } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileNav } from "@/components/MobileNav";
import { AccountBanner } from "@/components/AccountBanner";
import { SafetyBanner } from "@/components/SafetyBanner";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});
const signika = Signika({
  subsets: ["latin"],
  variable: "--font-signika",
  display: "swap",
});

// En producción, define NEXT_PUBLIC_SITE_URL (p. ej. https://elmundotebusca.com)
// para que la imagen Open Graph y los enlaces sociales sean absolutos. En Vercel
// se detecta solo; si no, Next usa una URL relativa.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: {
    default: "El Mundo Te Busca — Personas desaparecidas tras el terremoto de Venezuela 2026",
    template: "%s · El Mundo Te Busca",
  },
  applicationName: "El Mundo Te Busca",
  description:
    "Iniciativa ciudadana, voluntaria y sin fines de lucro para localizar personas desaparecidas y coordinar ayuda tras el terremoto de Venezuela 2026.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "El Mundo Te Busca — Respuesta al terremoto de Venezuela 2026",
    description:
      "Plataforma ciudadana para localizar personas desaparecidas y coordinar ayuda tras el terremoto de Venezuela 2026.",
    type: "website",
    locale: "es_VE",
    siteName: "El Mundo Te Busca",
  },
  twitter: {
    card: "summary_large_image",
    title: "El Mundo Te Busca — Respuesta al terremoto de Venezuela 2026",
    description:
      "Plataforma ciudadana para localizar personas desaparecidas y coordinar ayuda tras el terremoto de Venezuela 2026.",
  },
};

export const viewport: Viewport = {
  themeColor: "#d3824a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${figtree.variable} ${signika.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Saltar al contenido
        </a>
        <SiteHeader />
        <SafetyBanner />
        <AccountBanner />
        <main id="contenido" tabIndex={-1} className="flex-1 pb-20 outline-none md:pb-0">
          {children}
        </main>
        <SiteFooter />
        <MobileNav />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
