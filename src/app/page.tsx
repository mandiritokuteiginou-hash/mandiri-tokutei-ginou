import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Hero from "@/components/landing/Hero";
import ProgramExplainer from "@/components/landing/ProgramExplainer";
import Services from "@/components/landing/Services";
import Jobs from "@/components/landing/Jobs";
import Gallery from "@/components/landing/Gallery";
import Testimonials from "@/components/landing/Testimonials";
import Faq from "@/components/landing/Faq";
import ArticlesTeaser from "@/components/landing/ArticlesTeaser";
import ContactCta from "@/components/landing/ContactCta";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <ProgramExplainer />
        <Services />
        <Jobs />
        <Gallery />
        <Testimonials />
        <ArticlesTeaser />
        <Faq />
        <ContactCta />
      </main>
      <Footer />
    </>
  );
}
