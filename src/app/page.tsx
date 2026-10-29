import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Pricing } from "@/components/landing/pricing";
import { Testimonials } from "@/components/landing/testimonials";
import { CallToAction, Faq, Footer } from "@/components/landing/faq-cta-footer";
import { getSession } from "@/lib/session";

export default async function LandingPage() {
  const session = await getSession();
  return (
    <>
      <Navbar authed={Boolean(session)} />
      <main>
        <Hero />
        <Features />
        <Pricing />
        <Testimonials />
        <Faq />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
