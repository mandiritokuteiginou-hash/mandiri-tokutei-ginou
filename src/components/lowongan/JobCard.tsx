import Link from "next/link";
import { JobOrder } from "@/lib/types";

export default function JobCard({ job }: { job: JobOrder }) {
  return (
    <div className="rounded-2xl border border-black/5 p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="rounded-full bg-brand-navy/5 px-3 py-1 text-xs font-medium text-brand-navy">
            {job.sektor}
          </span>
          <h3 className="mt-3 text-lg font-semibold text-brand-navy">
            {job.nama_perusahaan}
          </h3>
          <p className="text-sm text-neutral-500">{job.lokasi_prefektur}</p>
        </div>
        {job.durasi_kontrak && (
          <span className="shrink-0 rounded-full bg-brand-gold/15 px-3 py-1 text-xs font-semibold text-brand-gold">
            {job.durasi_kontrak}
          </span>
        )}
      </div>

      {job.deskripsi_kerja && (
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          {job.deskripsi_kerja}
        </p>
      )}

      {job.syarat && (
        <div className="mt-4 flex flex-wrap gap-2">
          {job.syarat.split(";").map((req) => (
            <span
              key={req}
              className="rounded-full border border-black/10 px-3 py-1 text-xs text-neutral-600"
            >
              {req.trim()}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-4">
        <span className="text-sm font-semibold text-brand-navy">
          {job.estimasi_gaji}
        </span>
        <Link
          href="/portal/register"
          className="rounded-full bg-brand-navy px-4 py-2 text-xs font-semibold text-white hover:bg-brand-navy-dark"
        >
          Lamar Posisi Ini
        </Link>
      </div>
    </div>
  );
}
