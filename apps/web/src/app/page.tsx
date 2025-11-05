"use client";

import CallToAction from "./_components/call-to-action";
import FAQs from "./_components/faqs";
import Features from "./_components/features-1";
import FooterSection from "./_components/footer";
import HeroSection from "./_components/hero-section";
import StatsSection from "./_components/stats";

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
