import Link from "next/link";
import { ARTICLES } from "@/lib/articles";

export default function ArticlesTeaser() {
  const latest = ARTICLES.slice(0, 3);

  return (
    <section id="artikel" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-red">
            Artikel Terbaru
          </span>
          <h2 className="mt-3 text-2xl font-bold text-brand-navy sm:text-3xl">
            Panduan &amp; Tips Seputar Tokutei Ginou
          </h2>
        </div>
        <Link
          href="/artikel"
          className="text-sm font-semibold text-brand-red hover:text-brand-red-dark"
        >
          Lihat semua artikel →
        </Link>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {latest.map((article) => (
          <Link
            key={article.slug}
            href={`/artikel/${article.slug}`}
            className="group flex flex-col rounded-2xl border border-black/5 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <span className="w-fit rounded-full bg-brand-navy/5 px-3 py-1 text-xs font-semibold text-brand-navy">
              {article.category}
            </span>
            <h3 className="mt-4 text-base font-semibold text-brand-navy group-hover:text-brand-red">
              {article.title}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-600">
              {article.excerpt}
            </p>
            <span className="mt-4 text-xs text-neutral-400">
              {article.readMinutes} menit baca
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
