import Link from "next/link";
import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ARTICLES } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Artikel & Tips Kerja di Jepang",
  description:
    "Panduan, tips belajar bahasa Jepang, dan cerita alumni seputar program Tokutei Ginou (Specified Skilled Worker) dari Mandiri Tokutei Ginou.",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ArtikelPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-brand-cream">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-red">
            Artikel
          </span>
          <h1 className="mt-3 text-2xl font-bold text-brand-navy sm:text-3xl">
            Panduan &amp; Cerita Seputar Tokutei Ginou
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-neutral-600">
            Kumpulan artikel untuk membantu Anda mempersiapkan diri: dari
            perbedaan jalur visa, tips belajar bahasa Jepang, dokumen yang
            perlu disiapkan, hingga cerita nyata kehidupan di Jepang.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {ARTICLES.map((article) => (
              <Link
                key={article.slug}
                href={`/artikel/${article.slug}`}
                className="group flex flex-col rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <span className="w-fit rounded-full bg-brand-red/10 px-3 py-1 text-xs font-semibold text-brand-red">
                  {article.category}
                </span>
                <h2 className="mt-4 text-lg font-semibold text-brand-navy group-hover:text-brand-red">
                  {article.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-600">
                  {article.excerpt}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-neutral-400">
                  <span>{formatDate(article.publishedAt)}</span>
                  <span>{article.readMinutes} menit baca</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
