"use client";

import CallToAction from "./_components/call-to-action";
import Features from "./_components/features-1";
import FooterSection from "./_components/footer";
import HeroSection from "./_components/hero-section";

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
