import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import { JobOrder } from "@/lib/types";
import JobCard from "@/components/lowongan/JobCard";

async function getActiveJobs(): Promise<JobOrder[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("job_orders")
    .select("*")
    .eq("status_aktif", true)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error("Failed to load job_orders:", error.message);
    return [];
  }
  return data ?? [];
}

export default async function Jobs() {
  const jobs = await getActiveJobs();

  return (
    <section id="lowongan" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-red">
            Lowongan Aktif
          </span>
          <h2 className="mt-3 text-2xl font-bold text-brand-navy sm:text-3xl">
            Posisi Tokutei Ginou yang Sedang Dibuka
          </h2>
        </div>
        <Link
          href="/lowongan"
          className="text-sm font-semibold text-brand-red hover:text-brand-red-dark"
        >
          Lihat semua lowongan →
        </Link>
      </div>

      {jobs.length === 0 ? (
        <p className="mt-10 text-sm text-neutral-500">
          Belum ada lowongan aktif saat ini. Silakan cek kembali nanti.
        </p>
      ) : (
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </section>
  );
}
