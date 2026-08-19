import Link from "next/link";
import { MATERIALS } from "@/lib/materials";

export default function MaterialsTeaser() {
  const featured = MATERIALS.slice(0, 3);

  return (
    <section id="materi-belajar" className="bg-brand-cream py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <span className="text-sm font-semibold uppercase tracking-wide text-brand-red">
              Materi Belajar
            </span>
            <h2 className="mt-3 text-2xl font-bold text-brand-navy sm:text-3xl">
              Kosakata &amp; Budaya Kerja Jepang, Gratis untuk Dipelajari
            </h2>
          </div>
          <Link
            href="/materi-belajar"
            className="text-sm font-semibold text-brand-red hover:text-brand-red-dark"
          >
            Lihat semua materi →
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {featured.map((material) => (
            <Link
              key={material.slug}
              href={`/materi-belajar/${material.slug}`}
              className="group flex flex-col rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="w-fit rounded-full bg-brand-navy/5 px-3 py-1 text-xs font-semibold text-brand-navy">
                  {material.category}
                </span>
                <span className="text-xs font-semibold text-brand-gold">
                  {material.level}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-brand-navy group-hover:text-brand-red">
                {material.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-600">
                {material.excerpt}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
