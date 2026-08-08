import Link from "next/link";
import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MATERIALS } from "@/lib/materials";

export const metadata: Metadata = {
  title: "Materi Belajar Bahasa & Budaya Kerja Jepang",
  description:
    "Kosakata, frasa, dan panduan budaya kerja Jepang untuk persiapan program Tokutei Ginou — dari sapaan dasar hingga istilah khusus tiap sektor kerja.",
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
            Bahasa &amp; Budaya Kerja Jepang untuk Persiapan Tokutei Ginou
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-neutral-600">
            Kumpulan kosakata, frasa, dan panduan budaya kerja untuk membantu
            Anda siap berkomunikasi sejak hari pertama kerja di Jepang.
            Materi ini melengkapi kelas persiapan bahasa yang Anda ikuti
            selama program.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {MATERIALS.map((material) => (
              <Link
                key={material.slug}
                href={`/materi-belajar/${material.slug}`}
                className="group flex flex-col rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="w-fit rounded-full bg-brand-navy/5 px-3 py-1 text-xs font-semibold text-brand-navy">
                    {material.category}
                  </span>
                  <span className="text-xs font-semibold text-brand-gold">
                    {material.level}
                  </span>
                </div>
                <h2 className="mt-4 text-lg font-semibold text-brand-navy group-hover:text-brand-red">
                  {material.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-600">
                  {material.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
