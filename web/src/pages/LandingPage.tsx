import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { TechBar } from "@/components/landing/TechBar";
import { CapabilitiesChess } from "@/components/landing/CapabilitiesChess";
import { CapabilitiesGrid } from "@/components/landing/CapabilitiesGrid";
import { ArchitectureSection } from "@/components/landing/ArchitectureSection";
import { TerrenosSection } from "@/components/landing/TerrenosSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { ThesisSection } from "@/components/landing/ThesisSection";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <LandingNav />
      <Hero />
      <TechBar />
      <CapabilitiesChess />
      <CapabilitiesGrid />
      <ArchitectureSection />
      <TerrenosSection />
      <StatsSection />
      <ThesisSection />
    </div>
  );
}
