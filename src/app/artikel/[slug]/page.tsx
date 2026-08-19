import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ARTICLES, getArticleBySlug } from "@/lib/articles";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      publishedTime: article.publishedAt,
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <Link
            href="/artikel"
            className="text-sm font-medium text-brand-red hover:text-brand-red-dark"
          >
            ← Semua Artikel
          </Link>

          <span className="mt-6 inline-block w-fit rounded-full bg-brand-red/10 px-3 py-1 text-xs font-semibold text-brand-red">
            {article.category}
          </span>
          <h1 className="mt-4 text-2xl font-bold text-brand-navy sm:text-3xl">
            {article.title}
          </h1>
          <div className="mt-3 flex items-center gap-3 text-xs text-neutral-400">
            <span>{formatDate(article.publishedAt)}</span>
            <span>·</span>
            <span>{article.readMinutes} menit baca</span>
          </div>

          <div className="mt-8 space-y-5">
            {article.content.map((paragraph, i) => (
              <p key={i} className="text-sm leading-relaxed text-neutral-700 sm:text-base">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-12 rounded-2xl bg-brand-cream p-6 text-center">
            <p className="text-sm text-neutral-700">
              Tertarik memulai perjalanan karier di Jepang?
            </p>
            <Link
              href="/portal/register"
              className="mt-3 inline-block rounded-full bg-brand-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-red-dark"
            >
              Daftar sebagai Kandidat
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
