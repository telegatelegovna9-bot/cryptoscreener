"use client";

import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { TickerTape } from "@/components/landing/TickerTape";
import { Features } from "@/components/landing/Features";
import { LivePreview } from "@/components/landing/LivePreview";
import { Stats } from "@/components/landing/Stats";
import { Pricing } from "@/components/landing/Pricing";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <TickerTape />
      <Features />
      <LivePreview />
      <Stats />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
