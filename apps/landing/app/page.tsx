"use client";

import { BenefitsSection } from "@/components/benefits-section";
import { FaqSection } from "@/components/faq-section";
import { FeaturesSection } from "@/components/features-section";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/hero-section";
import { ImpactSection } from "@/components/impact-section";
import { Navbar } from "@/components/navbar";
import { PricingSection } from "@/components/pricing-section";
import { WhyChooseUs } from "@/components/why-choose-us";

export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-secondary selection:text-black">
      <HeroSection />

      <WhyChooseUs />

      <FeaturesSection />

      <BenefitsSection />

      <PricingSection />

      <ImpactSection />

      <FaqSection />

      <Footer />
    </div>
  );
}
