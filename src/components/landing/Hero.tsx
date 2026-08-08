import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-navy text-white">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-red/30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-brand-gold/20 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-20 sm:px-6 md:flex-row md:items-center md:py-28">
        <div className="max-w-xl">
          <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-brand-gold">
            Program Specified Skilled Worker (特定技能)
          </span>
          <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
            Wujudkan Karier Kerja di Jepang Lewat Jalur Tokutei Ginou
          </h1>
          <p className="mt-5 text-base leading-relaxed text-neutral-300 sm:text-lg">
            Mandiri Tokutei Ginou mendampingi talenta Indonesia sejak
            pelatihan bahasa &amp; keterampilan, ujian sertifikasi, hingga
            penempatan kerja resmi di perusahaan Jepang — transparan dan
            tanpa biaya tersembunyi.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#kontak"
              className="rounded-full bg-brand-red px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-red/30 transition hover:bg-brand-red-dark"
            >
              Daftar Sekarang
            </a>
            <a
              href="#program"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Pelajari Program
            </a>
          </div>

          <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-white/10 pt-6">
            <div>
              <dt className="text-2xl font-bold text-brand-gold sm:text-3xl">500+</dt>
              <dd className="mt-1 text-xs text-neutral-400 sm:text-sm">Kandidat ditempatkan</dd>
            </div>
            <div>
              <dt className="text-2xl font-bold text-brand-gold sm:text-3xl">6</dt>
              <dd className="mt-1 text-xs text-neutral-400 sm:text-sm">Sektor kerja tersedia</dd>
            </div>
            <div>
              <dt className="text-2xl font-bold text-brand-gold sm:text-3xl">98%</dt>
              <dd className="mt-1 text-xs text-neutral-400 sm:text-sm">Tingkat kelulusan ujian</dd>
            </div>
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h2 className="text-sm font-semibold text-brand-gold">Alur Program</h2>
          <ol className="mt-4 space-y-4">
            {[
              ["1", "Pendaftaran & Seleksi Awal"],
              ["2", "Pelatihan Bahasa & Skill"],
              ["3", "Ujian Skill + JLPT/JFT-Basic"],
              ["4", "Pencocokan Perusahaan Jepang"],
              ["5", "Pengurusan Visa & Keberangkatan"],
            ].map(([step, label]) => (
              <li key={step} className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-red text-xs font-bold">
                  {step}
                </span>
                <span className="pt-1 text-sm text-neutral-200">{label}</span>
              </li>
            ))}
          </ol>
          <Link
            href="/portal/register"
            className="mt-6 block rounded-lg bg-white/10 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Mulai Pendaftaran Online →
          </Link>
        </div>
      </div>
    </section>
  );
}
