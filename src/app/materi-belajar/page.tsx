import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MaterialsBrowser from "@/components/materi/MaterialsBrowser";
import { MATERIALS } from "@/lib/materials";

export const metadata: Metadata = {
  title: "Materi Belajar Bahasa Jepang: N5 sampai N1",
  description:
    "Kosakata, tata bahasa, dan kanji bahasa Jepang tersusun bertahap dari nol (N5) hingga mahir (N1), plus istilah khusus tiap sektor kerja Tokutei Ginou.",
};

export default function MateriBelajarPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-brand-cream">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-red">
            Materi Belajar
          </span>
          <h1 className="mt-3 text-2xl font-bold text-brand-navy sm:text-3xl">
            Bahasa Jepang dari Nol Sampai N1, Plus Budaya Kerja
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-neutral-600">
            Kumpulan huruf, tata bahasa, kanji, dan kosakata tersusun
            bertahap per level JLPT (N5–N1), lengkap dengan istilah kerja
            khusus tiap sektor dan panduan budaya kerja. Materi ini
            melengkapi kelas persiapan bahasa yang Anda ikuti selama
            program.
          </p>

          <div className="mt-10">
            <MaterialsBrowser materials={MATERIALS} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
