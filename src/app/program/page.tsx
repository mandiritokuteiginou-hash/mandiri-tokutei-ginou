import Link from "next/link";
import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SECTORS } from "@/lib/data";

export const metadata: Metadata = {
  title: "Program Tokutei Ginou Selengkapnya",
  description:
    "Penjelasan lengkap program Tokutei Ginou (特定技能): SSW-1 vs SSW-2, alur proses dari pendaftaran hingga keberangkatan, transparansi biaya, dan hak-hak pekerja.",
};

const TIMELINE = [
  { step: "Pendaftaran & Seleksi Awal", duration: "1-2 minggu", desc: "Verifikasi berkas dan kecocokan syarat dasar (usia, kesehatan, sektor minat)." },
  { step: "Pelatihan Bahasa & Skill", duration: "3-6 bulan", desc: "Kelas bahasa Jepang (JLPT N4/JFT-Basic) dan pelatihan keterampilan sesuai sektor." },
  { step: "Ujian Skill & Bahasa", duration: "Sesuai jadwal ujian resmi", desc: "Ujian keterampilan spesifik sektor (skill test) dan ujian bahasa Jepang." },
  { step: "Pencocokan dengan Perusahaan Jepang", duration: "1-2 bulan", desc: "Pencocokan profil kandidat dengan lowongan dari perusahaan penerima." },
  { step: "Wawancara & Penerimaan", duration: "2-4 minggu", desc: "Wawancara (online/offline) dengan perusahaan Jepang hingga surat penerimaan." },
  { step: "Pengurusan COE & Visa", duration: "1-3 bulan", desc: "Certificate of Eligibility diproses oleh imigrasi Jepang, dilanjutkan pengajuan visa." },
  { step: "Persiapan Keberangkatan", duration: "2-4 minggu", desc: "Pembekalan akhir, pengurusan tiket, dan dokumen perjalanan." },
  { step: "Keberangkatan & Mulai Kerja", duration: "-", desc: "Tiba di Jepang dan memulai kontrak kerja di perusahaan penerima." },
];

const SSW_COMPARISON = [
  { aspek: "Masa tinggal", ssw1: "Maks. 5 tahun (per 1 tahun/6 bulan/4 bulan, dapat diperpanjang)", ssw2: "Tidak dibatasi jumlah tahun, dapat terus diperpanjang selama memenuhi syarat" },
  { aspek: "Membawa keluarga", ssw1: "Tidak diperbolehkan", ssw2: "Diperbolehkan (pasangan & anak)" },
  { aspek: "Syarat keterampilan", ssw1: "Lulus ujian skill dasar sektor terkait", ssw2: "Perlu pengalaman sebagai supervisor/pengawas + lulus ujian skill lanjutan" },
  { aspek: "Cakupan sektor", ssw1: "Tersedia di semua sektor yang dilayani Mandiri Tokutei Ginou", ssw2: "Baru tersedia di sebagian sektor (terus diperluas pemerintah Jepang)" },
  { aspek: "Jalur jangka panjang", ssw1: "Tidak otomatis menuju status tinggal permanen", ssw2: "Berpotensi menjadi jalur menuju status tinggal permanen setelah bertahun-tahun" },
];

export default function ProgramPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="bg-brand-navy py-16 text-white">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <span className="text-sm font-semibold uppercase tracking-wide text-brand-gold">
              Program Tokutei Ginou
            </span>
            <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
              Panduan Lengkap Visa Kerja Tokutei Ginou (特定技能)
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-300 sm:text-base">
              Semua yang perlu Anda ketahui sebelum mendaftar: perbedaan
              SSW-1 dan SSW-2, tahapan proses dari pendaftaran hingga
              keberangkatan, transparansi biaya, dan hak-hak Anda sebagai
              pekerja.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <section>
            <h2 className="text-xl font-bold text-brand-navy">SSW-1 vs SSW-2</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Tokutei Ginou terbagi dua kategori. Sebagian besar kandidat
              memulai dari SSW-1, lalu berpotensi naik ke SSW-2 setelah
              memiliki pengalaman kerja dan keterampilan lanjutan.
            </p>
            <div className="mt-6 overflow-x-auto rounded-2xl border border-black/5">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-black/5 bg-brand-cream text-xs uppercase text-neutral-500">
                    <th className="px-4 py-3">Aspek</th>
                    <th className="px-4 py-3">SSW-1 (特定技能1号)</th>
                    <th className="px-4 py-3">SSW-2 (特定技能2号)</th>
                  </tr>
                </thead>
                <tbody>
                  {SSW_COMPARISON.map((row) => (
                    <tr key={row.aspek} className="border-b border-black/5 last:border-0">
                      <td className="px-4 py-3 font-medium text-brand-navy">{row.aspek}</td>
                      <td className="px-4 py-3 text-neutral-700">{row.ssw1}</td>
                      <td className="px-4 py-3 text-neutral-700">{row.ssw2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-16">
            <h2 className="text-xl font-bold text-brand-navy">Alur Proses & Estimasi Durasi</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Total waktu dari pendaftaran hingga keberangkatan umumnya
              berkisar 4-8 bulan, tergantung kecepatan kelulusan ujian dan
              proses imigrasi Jepang.
            </p>
            <ol className="mt-6 space-y-4">
              {TIMELINE.map((item, i) => (
                <li
                  key={item.step}
                  className="flex gap-4 rounded-xl border border-black/5 p-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-red text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-brand-navy">{item.step}</h3>
                      <span className="rounded-full bg-brand-gold/15 px-2 py-0.5 text-xs font-semibold text-brand-gold">
                        {item.duration}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-neutral-600">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-16">
            <h2 className="text-xl font-bold text-brand-navy">Transparansi Biaya</h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">
              Kami berkomitmen tidak ada biaya tersembunyi. Rincian biaya
              dijelaskan secara terbuka sejak konsultasi awal sebelum Anda
              memutuskan mendaftar, umumnya mencakup:
            </p>
            <ul className="mt-4 space-y-2">
              {[
                "Pelatihan bahasa Jepang dan keterampilan sesuai sektor",
                "Pengurusan dokumen resmi (paspor, COE, visa kerja)",
                "Biaya ujian skill dan ujian bahasa (JLPT/JFT-Basic)",
                "Tiket keberangkatan — sebagian besar perusahaan penerima menanggung atau mensubsidi biaya ini",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-neutral-700">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-neutral-600">
              Beberapa komponen biaya dapat dibayar bertahap atau dipotong
              dari gaji awal sesuai kesepakatan tertulis dengan perusahaan
              penerima — semua kesepakatan ini dijelaskan dan disetujui
              sebelum kontrak kerja ditandatangani.
            </p>
          </section>

          <section className="mt-16">
            <h2 className="text-xl font-bold text-brand-navy">Hak &amp; Perlindungan Hukum</h2>
            <ul className="mt-4 space-y-3">
              {[
                "Kontrak kerja tertulis dengan gaji minimal sesuai standar upah daerah kerja di Jepang.",
                "Jaminan sosial: asuransi kesehatan, asuransi tenaga kerja, dan program pensiun sesuai ketentuan Jepang.",
                "Hanya bekerja melalui lembaga pengirim dan perusahaan penerima yang terdaftar resmi — melindungi Anda dari praktik calo ilegal.",
                "Berhak melapor ke lembaga pendukung terdaftar (registered support organization) jika mengalami masalah di tempat kerja.",
                "Berhak pindah kerja ke perusahaan lain dalam sektor yang sama jika terjadi masalah kontrak, sesuai ketentuan visa Tokutei Ginou.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-neutral-700">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-16">
            <h2 className="text-xl font-bold text-brand-navy">Sektor Kerja yang Tersedia</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SECTORS.map((sector) => (
                <div
                  key={sector}
                  className="rounded-lg border border-black/5 bg-brand-cream px-4 py-3 text-sm font-medium text-brand-navy"
                >
                  {sector}
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-neutral-600">
              Ingin kosakata kerja untuk sektor pilihan Anda? Lihat{" "}
              <Link href="/materi-belajar" className="font-semibold text-brand-red hover:text-brand-red-dark">
                Materi Belajar
              </Link>{" "}
              untuk kosakata dan frasa per sektor.
            </p>
          </section>

          <div className="mt-16 rounded-2xl bg-brand-red p-8 text-center text-white">
            <h2 className="text-xl font-bold">Siap Memulai Pendaftaran?</h2>
            <p className="mt-2 text-sm text-white/90">
              Tim kami siap membantu Anda dari konsultasi awal hingga keberangkatan.
            </p>
            <Link
              href="/portal/register"
              className="mt-5 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-red transition hover:bg-neutral-100"
            >
              Daftar Sekarang
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
