import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 items-center justify-center bg-brand-cream px-4 py-24">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-red">
            404
          </span>
          <h1 className="mt-3 text-2xl font-bold text-brand-navy sm:text-3xl">
            Halaman Tidak Ditemukan
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-neutral-600">
            Halaman yang Anda cari mungkin sudah dipindahkan atau tidak
            pernah ada. Coba kembali ke beranda atau jelajahi halaman lain.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="rounded-full bg-brand-red px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-red-dark"
            >
              Kembali ke Beranda
            </Link>
            <Link
              href="/program"
              className="rounded-full border border-brand-navy px-6 py-3 text-sm font-semibold text-brand-navy transition hover:bg-brand-navy hover:text-white"
            >
              Lihat Program
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
