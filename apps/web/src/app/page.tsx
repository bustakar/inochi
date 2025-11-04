"use client";

import CallToAction from "@/app/_components/call-to-action";
import Features from "@/app/_components/features-1";
import FooterSection from "@/app/_components/footer";
import HeroSection from "@/app/_components/hero-section";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <Features />
      {/* <StatsSection /> */}
      {/* <FAQs /> */}
      <CallToAction />
      <FooterSection />
    </main>
  );
}
