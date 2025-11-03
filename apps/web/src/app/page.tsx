"use client";

import CallToAction from "@/app/_components/call-to-action";
import FAQs from "@/app/_components/faqs";
import Features from "@/app/_components/features-1";
import FooterSection from "@/app/_components/footer";
import HeroSection from "@/app/_components/hero-section";
import StatsSection from "@/app/_components/stats";

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
