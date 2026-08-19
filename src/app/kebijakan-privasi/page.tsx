import Link from "next/link";
import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Bagaimana Mandiri Tokutei Ginou mengumpulkan, menyimpan, dan melindungi data pribadi kandidat, termasuk NIK, dokumen identitas, dan data pendaftaran.",
};

const LAST_UPDATED = "8 Agustus 2026";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-red">
            Legal
          </span>
          <h1 className="mt-3 text-2xl font-bold text-brand-navy sm:text-3xl">
            Kebijakan Privasi
          </h1>
          <p className="mt-2 text-xs text-neutral-400">Terakhir diperbarui: {LAST_UPDATED}</p>

          <div className="mt-8 space-y-8 text-sm leading-relaxed text-neutral-700">
            <p>
              Mandiri Tokutei Ginou (&quot;kami&quot;) menghargai privasi
              setiap kandidat yang mendaftar melalui website ini. Kebijakan
              ini menjelaskan data pribadi apa saja yang kami kumpulkan,
              bagaimana data tersebut digunakan, disimpan, dan dilindungi.
            </p>

            <section>
              <h2 className="text-base font-semibold text-brand-navy">
                1. Data yang Kami Kumpulkan
              </h2>
              <ul className="mt-3 space-y-2">
                <li>• Data identitas: nama lengkap, NIK, tanggal lahir, alamat domisili.</li>
                <li>• Data kontak: nomor WhatsApp/telepon dan alamat email.</li>
                <li>• Data pendidikan dan pengalaman kerja.</li>
                <li>• Dokumen pendukung: KTP/paspor, Kartu Keluarga, ijazah, SKCK, pas foto.</li>
                <li>• Data akun: email dan kata sandi (tersimpan terenkripsi) untuk Portal Kandidat.</li>
                <li>• Data teknis dasar (log akses) untuk keperluan keamanan sistem.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-brand-navy">
                2. Tujuan Penggunaan Data
              </h2>
              <p className="mt-3">
                Data Anda digunakan semata-mata untuk keperluan proses
                pendaftaran, pelatihan, dan penempatan kerja program Tokutei
                Ginou, termasuk: verifikasi kelayakan, pencocokan dengan
                perusahaan penerima di Jepang, pengurusan dokumen resmi
                (COE, visa), dan komunikasi terkait status pendaftaran Anda.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-brand-navy">
                3. Penyimpanan &amp; Keamanan Data
              </h2>
              <p className="mt-3">
                Data disimpan pada infrastruktur basis data dengan akses
                terbatas (row-level security) — kandidat hanya dapat
                mengakses data miliknya sendiri, dan tim internal kami hanya
                dapat mengakses data yang diperlukan untuk memproses
                pendaftaran. Dokumen yang Anda unggah disimpan di
                penyimpanan privat yang tidak dapat diakses publik.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-brand-navy">
                4. Berbagi Data dengan Pihak Ketiga
              </h2>
              <p className="mt-3">
                Kami hanya membagikan data yang diperlukan kepada perusahaan
                penerima (kikan) dan lembaga pemerintah terkait di Jepang
                (mis. untuk pengurusan Certificate of Eligibility dan visa)
                sebagai bagian dari proses penempatan kerja yang Anda
                setujui. Kami tidak menjual atau membagikan data Anda kepada
                pihak ketiga untuk kepentingan pemasaran tanpa izin Anda.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-brand-navy">
                5. Hak Anda atas Data Pribadi
              </h2>
              <p className="mt-3">
                Anda berhak meminta akses, koreksi, atau penghapusan data
                pribadi Anda yang kami simpan, selama tidak bertentangan
                dengan kewajiban hukum atau proses pendaftaran yang sedang
                berjalan. Hubungi kami melalui kontak di bawah untuk
                mengajukan permintaan ini.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-brand-navy">
                6. Perubahan Kebijakan
              </h2>
              <p className="mt-3">
                Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan
                signifikan akan diinformasikan melalui website ini.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-brand-navy">7. Kontak</h2>
              <p className="mt-3">
                Untuk pertanyaan seputar privasi data, hubungi kami di{" "}
                <a href="mailto:info@mandiritokuteiginou.id" className="text-brand-red hover:text-brand-red-dark">
                  info@mandiritokuteiginou.id
                </a>{" "}
                atau +62 812-3456-7890 (WhatsApp).
              </p>
            </section>
          </div>

          <div className="mt-12 flex flex-wrap gap-3 border-t border-black/5 pt-8 text-sm">
            <Link href="/syarat-ketentuan" className="font-semibold text-brand-red hover:text-brand-red-dark">
              Baca Syarat &amp; Ketentuan →
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
