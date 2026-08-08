import { JOBS } from "@/lib/data";

export default function Jobs() {
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
        <a
          href="/portal/register"
          className="text-sm font-semibold text-brand-red hover:text-brand-red-dark"
        >
          Lihat semua &amp; daftar →
        </a>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {JOBS.map((job) => (
          <div
            key={job.id}
            className="rounded-2xl border border-black/5 p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="rounded-full bg-brand-navy/5 px-3 py-1 text-xs font-medium text-brand-navy">
                  {job.sector}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-brand-navy">
                  {job.title}
                </h3>
                <p className="text-sm text-neutral-500">{job.location}</p>
              </div>
              <span className="shrink-0 rounded-full bg-brand-gold/15 px-3 py-1 text-xs font-semibold text-brand-gold">
                {job.slots} slot
              </span>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-neutral-600">
              {job.description}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {job.requirements.map((req) => (
                <span
                  key={req}
                  className="rounded-full border border-black/10 px-3 py-1 text-xs text-neutral-600"
                >
                  {req}
                </span>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-4">
              <span className="text-sm font-semibold text-brand-navy">
                {job.salaryRange}
              </span>
              <a
                href="/portal/register"
                className="rounded-full bg-brand-navy px-4 py-2 text-xs font-semibold text-white hover:bg-brand-navy-dark"
              >
                Lamar Posisi Ini
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
