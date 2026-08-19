import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Furigana from "@/components/materi/Furigana";
import { MATERIALS, getMaterialBySlug } from "@/lib/materials";

export function generateStaticParams() {
  return MATERIALS.map((material) => ({ slug: material.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const material = getMaterialBySlug(slug);
  if (!material) return {};
  return {
    title: material.title,
    description: material.excerpt,
  };
}

export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const material = getMaterialBySlug(slug);
  if (!material) notFound();

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <Link
            href="/materi-belajar"
            className="text-sm font-medium text-brand-red hover:text-brand-red-dark"
          >
            ← Semua Materi Belajar
          </Link>

          <div className="mt-6 flex items-center gap-2">
            <span className="w-fit rounded-full bg-brand-navy/5 px-3 py-1 text-xs font-semibold text-brand-navy">
              {material.category}
            </span>
            <span className="text-xs font-semibold text-brand-gold">
              Level {material.level}
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-brand-navy sm:text-3xl">
            {material.title}
          </h1>

          <div className="mt-8 space-y-4">
            {material.intro.map((paragraph, i) => (
              <p key={i} className="text-sm leading-relaxed text-neutral-700 sm:text-base">
                {paragraph}
              </p>
            ))}
          </div>

          {material.chart && (
            <div className="mt-8 grid grid-cols-5 gap-3 sm:grid-cols-8">
              {material.chart.map((entry) => (
                <div
                  key={entry.char}
                  className="flex flex-col items-center justify-center rounded-xl border border-black/5 bg-white py-3 shadow-sm"
                >
                  <span className="text-2xl font-medium text-brand-navy">{entry.char}</span>
                  <span className="mt-1 text-xs text-neutral-500">{entry.romaji}</span>
                </div>
              ))}
            </div>
          )}

          {material.examples && (
            <div className="mt-8 space-y-3 rounded-2xl border border-black/5 p-6">
              <h2 className="text-sm font-semibold text-brand-navy">Contoh Kalimat</h2>
              {material.examples.map((ex, i) => (
                <div key={i} className="border-b border-black/5 pb-3 last:border-0 last:pb-0">
                  <p className="pt-2 text-base leading-loose font-medium text-brand-navy">
                    <Furigana text={ex.jp} />
                  </p>
                  <p className="text-sm text-neutral-500">{ex.id}</p>
                </div>
              ))}
            </div>
          )}

          {material.vocab && (
            <div className="mt-8 overflow-x-auto rounded-2xl border border-black/5">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-black/5 bg-brand-cream text-xs uppercase text-neutral-500">
                    <th className="px-4 py-3">Bahasa Jepang</th>
                    <th className="px-4 py-3">Romaji</th>
                    <th className="px-4 py-3">Arti</th>
                  </tr>
                </thead>
                <tbody>
                  {material.vocab.map((entry) => (
                    <tr key={entry.jp} className="border-b border-black/5 last:border-0">
                      <td className="px-4 py-3 pt-4 text-base leading-loose font-medium text-brand-navy">
                        <Furigana text={entry.jp} />
                      </td>
                      <td className="px-4 py-3 text-neutral-500 italic">{entry.romaji}</td>
                      <td className="px-4 py-3 text-neutral-700">{entry.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {material.tips && (
            <div className="mt-8 rounded-2xl bg-brand-cream p-6">
              <h2 className="text-sm font-semibold text-brand-navy">Tips Praktis</h2>
              <ul className="mt-3 space-y-2">
                {material.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                    <span className="mt-1 text-brand-red">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-12 rounded-2xl bg-brand-cream p-6 text-center">
            <p className="text-sm text-neutral-700">
              Ingin belajar lebih terarah dengan pembimbing?
            </p>
            <Link
              href="/portal/register"
              className="mt-3 inline-block rounded-full bg-brand-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-red-dark"
            >
              Daftar Program Pelatihan
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
