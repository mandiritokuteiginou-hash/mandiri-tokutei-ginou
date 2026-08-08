import { SECTORS } from "@/lib/data";

export default function ProgramExplainer() {
  return (
    <section id="program" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="grid gap-12 md:grid-cols-2 md:items-start">
        <div>
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-red">
            Apa itu Tokutei Ginou?
          </span>
          <h2 className="mt-3 text-2xl font-bold text-brand-navy sm:text-3xl">
            Visa Kerja Resmi Jepang untuk Pekerja Terampil
          </h2>
          <p className="mt-4 leading-relaxed text-neutral-600">
            <strong>Tokutei Ginou (特定技能 / Specified Skilled Worker)</strong>{" "}
            adalah status visa kerja resmi Pemerintah Jepang bagi tenaga kerja
            asing dengan keterampilan spesifik di sektor-sektor yang kekurangan
            tenaga kerja. Berbeda dari program magang, pemegang visa ini
            berstatus pekerja penuh dengan hak yang setara pekerja lokal:
            gaji layak, jaminan sosial, dan peluang perpanjangan kontrak
            hingga alih jenjang karier.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Gaji dan kontrak kerja setara standar Jepang",
              "Masa kerja hingga 5 tahun (SSW-1), dapat lanjut ke SSW-2",
              "Bisa membawa keluarga untuk kategori tertentu (SSW-2)",
              "Perlindungan hukum ketenagakerjaan Jepang",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-neutral-700">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-black/5 bg-brand-cream p-6 sm:p-8">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-navy">
            Sektor Kerja yang Tersedia
          </h3>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {SECTORS.map((sector) => (
              <div
                key={sector}
                className="rounded-lg border border-black/5 bg-white px-4 py-3 text-sm font-medium text-brand-navy shadow-sm"
              >
                {sector}
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs leading-relaxed text-neutral-500">
            Syarat umum: usia 19-35 tahun, sehat jasmani &amp; rohani, lulus
            ujian skill sektor terkait, dan minimal setara JLPT N4 / JFT-Basic
            A2 untuk kemampuan bahasa Jepang.
          </p>
        </div>
      </div>
    </section>
  );
}
