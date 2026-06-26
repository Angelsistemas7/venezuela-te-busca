import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileNav } from "@/components/MobileNav";

export const metadata: Metadata = {
  title: "Venezuela te busca — Personas desaparecidas tras el terremoto 2026",
  description:
    "Iniciativa ciudadana, voluntaria y sin fines de lucro para localizar personas desaparecidas y coordinar ayuda tras el terremoto de Venezuela 2026.",
  openGraph: {
    title: "Venezuela te busca",
    description:
      "Plataforma ciudadana para localizar personas desaparecidas y coordinar ayuda tras el terremoto 2026.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <SiteFooter />
        <MobileNav />
      </body>
    </html>
  );
}
