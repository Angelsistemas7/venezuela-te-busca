import { DevModeNotice } from "@/components/DevModeNotice";
import { HomeHero } from "@/components/HomeHero";
import { VerifiedNewsCarousel } from "@/components/VerifiedNewsCarousel";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <DevModeNotice />
      <div className="flex flex-col gap-6">
        <HomeHero />
        <VerifiedNewsCarousel />
      </div>
    </div>
  );
}
