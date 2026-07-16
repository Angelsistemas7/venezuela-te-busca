import { Suspense } from "react";
import { DevModeNotice } from "@/components/DevModeNotice";
import { HomeHero } from "@/components/HomeHero";
import { VerifiedNewsCarousel } from "@/components/VerifiedNewsCarousel";
import { HomeHeroSkeleton, NewsCarouselSkeleton } from "@/components/HomeSkeletons";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <DevModeNotice />
      <div className="flex flex-col gap-6">
        {/* Cada sección en su propio Suspense: el hero (datos internos, rápido)
            no debe esperar al carrusel de noticias (APIs externas, puede
            tardar varios segundos) — así la página se ve de inmediato en vez
            de quedar en blanco hasta que ambas terminen. */}
        <Suspense fallback={<HomeHeroSkeleton />}>
          <HomeHero />
        </Suspense>
        <Suspense fallback={<NewsCarouselSkeleton />}>
          <VerifiedNewsCarousel />
        </Suspense>
      </div>
    </div>
  );
}
