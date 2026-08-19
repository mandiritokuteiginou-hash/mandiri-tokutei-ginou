import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JobsBrowser from "@/components/lowongan/JobsBrowser";
import { createPublicClient } from "@/lib/supabase/public";
import { JobOrder } from "@/lib/types";

export const metadata: Metadata = {
  title: "Lowongan Tokutei Ginou Terbaru | Mandiri Tokutei Ginou",
  description:
    "Jelajahi seluruh lowongan kerja Tokutei Ginou aktif di Jepang. Cari berdasarkan sektor, lokasi, dan posisi yang sesuai dengan minat Anda.",
};

export const revalidate = 300;

async function getActiveJobs(): Promise<JobOrder[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("job_orders")
    .select("*")
    .eq("status_aktif", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load job_orders:", error.message);
    return [];
  }
  return data ?? [];
}

export default async function LowonganPage() {
  const jobs = await getActiveJobs();

  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-red">
            Lowongan Aktif
          </span>
          <h1 className="mt-3 text-3xl font-bold text-brand-navy sm:text-4xl">
            Semua Lowongan Tokutei Ginou
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">
            Cari posisi yang sesuai dengan sektor dan lokasi yang Anda
            inginkan. Semua lowongan berikut aktif dan menerima pendaftaran
            kandidat.
          </p>

          <div className="mt-10">
            <JobsBrowser jobs={jobs} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
