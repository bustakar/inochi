"use client";

import CallToAction from "@/components/call-to-action";
import FAQs from "@/components/faqs";
import Features from "@/components/features-1";
import FooterSection from "@/components/footer";
import HeroSection from "@/components/hero-section";
import StatsSection from "@/components/stats";

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
