"use client";

import Benefits from "@/app/_components/Benefits";
import Footer from "@/app/_components/Footer";
import FooterHero from "@/app/_components/FooterHero";
import Hero from "@/app/_components/Hero";
import Testimonials from "@/app/_components/Testimonials";
import Header from "@/components/Header";

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <Benefits />
      <Testimonials />
      <FooterHero />
      <Footer />
    </main>
  );
}
