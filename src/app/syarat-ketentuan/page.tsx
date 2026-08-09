import Link from "next/link";
import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description:
    "Syarat dan ketentuan penggunaan layanan pendaftaran, pelatihan, dan penempatan kerja program Tokutei Ginou oleh Mandiri Tokutei Ginou.",
};

const LAST_UPDATED = "8 Agustus 2026";

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand-red">
            Legal
          </span>
          <h1 className="mt-3 text-2xl font-bold text-brand-navy sm:text-3xl">
            Syarat &amp; Ketentuan
          </h1>
          <p className="mt-2 text-xs text-neutral-400">Terakhir diperbarui: {LAST_UPDATED}</p>

          <div className="mt-8 space-y-8 text-sm leading-relaxed text-neutral-700">
            <p>
              Dengan mendaftar dan menggunakan layanan Mandiri Tokutei
              Ginou (&quot;kami&quot;), Anda (&quot;kandidat&quot;) menyetujui
              syarat dan ketentuan berikut. Mohon dibaca dengan saksama
              sebelum melanjutkan pendaftaran.
            </p>

            <section>
              <h2 className="text-base font-semibold text-brand-navy">
                1. Ruang Lingkup Layanan
              </h2>
              <p className="mt-3">
                Kami menyediakan layanan pelatihan bahasa &amp; keterampilan,
                pencocokan dengan perusahaan penerima di Jepang, serta
                pendampingan pengurusan dokumen untuk program visa Tokutei
                Ginou (特定技能). Kami bukan penjamin hasil akhir penempatan
                kerja, karena keputusan akhir penerimaan berada pada
                perusahaan penerima dan otoritas imigrasi Jepang.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-brand-navy">
                2. Pendaftaran Akun
              </h2>
              <p className="mt-3">
                Kandidat wajib memberikan data pribadi dan dokumen yang
                akurat, lengkap, dan sesuai kondisi sebenarnya. Data yang
                tidak akurat atau dipalsukan dapat mengakibatkan
                pembatalan pendaftaran tanpa pengembalian biaya yang telah
                dikeluarkan untuk proses yang sudah berjalan.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-brand-navy">
                3. Kewajiban Kandidat
              </h2>
              <ul className="mt-3 space-y-2">
                <li>• Mengikuti pelatihan dan ujian sesuai jadwal yang ditentukan.</li>
                <li>• Menjaga kerahasiaan akun (email dan kata sandi) Portal Kandidat.</li>
                <li>• Memberi tahu kami segera jika ada perubahan data penting (kontak, kesehatan, status hukum).</li>
                <li>• Mematuhi peraturan perundang-undangan Indonesia dan Jepang selama proses dan masa kerja.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-brand-navy">
                4. Biaya &amp; Pembayaran
              </h2>
              <p className="mt-3">
                Rincian biaya program dijelaskan secara terbuka sejak
                konsultasi awal sebelum kandidat menyetujui pendaftaran.
                Skema pembayaran (di muka, bertahap, atau potong gaji awal)
                disepakati tertulis dan dapat berbeda tergantung kesepakatan
                dengan perusahaan penerima. Lihat halaman{" "}
                <Link href="/program" className="text-brand-red hover:text-brand-red-dark">
                  Program
                </Link>{" "}
                untuk gambaran umum struktur biaya.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-brand-navy">
                5. Pembatalan &amp; Pengunduran Diri
              </h2>
              <p className="mt-3">
                Kandidat dapat mengundurkan diri dari program kapan saja
                dengan pemberitahuan tertulis. Biaya yang telah dikeluarkan
                untuk layanan yang sudah berjalan (pelatihan, ujian,
                pengurusan dokumen) tidak dapat dikembalikan, kecuali
                diatur lain dalam kesepakatan tertulis terpisah.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-brand-navy">
                6. Batasan Tanggung Jawab
              </h2>
              <p className="mt-3">
                Kami berupaya maksimal mendampingi kandidat, namun tidak
                bertanggung jawab atas penolakan visa, hasil ujian, atau
                keputusan perusahaan penerima yang berada di luar kendali
                kami. Kami juga tidak bertanggung jawab atas kerugian akibat
                data yang tidak akurat yang diberikan kandidat.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-brand-navy">
                7. Perubahan Ketentuan
              </h2>
              <p className="mt-3">
                Kami dapat memperbarui syarat dan ketentuan ini sewaktu-waktu.
                Perubahan signifikan akan diinformasikan melalui website ini
                atau kanal komunikasi resmi kami.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-brand-navy">
                8. Hukum yang Berlaku
              </h2>
              <p className="mt-3">
                Syarat dan ketentuan ini tunduk pada hukum Republik
                Indonesia, tanpa mengurangi ketentuan hukum Jepang yang
                berlaku selama masa kerja di Jepang.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-brand-navy">9. Kontak</h2>
              <p className="mt-3">
                Pertanyaan seputar syarat &amp; ketentuan dapat diajukan ke{" "}
                <a href="mailto:info@mandiritokuteiginou.id" className="text-brand-red hover:text-brand-red-dark">
                  info@mandiritokuteiginou.id
                </a>{" "}
                atau +62 812-3456-7890 (WhatsApp).
              </p>
            </section>
          </div>

          <div className="mt-12 flex flex-wrap gap-3 border-t border-black/5 pt-8 text-sm">
            <Link href="/kebijakan-privasi" className="font-semibold text-brand-red hover:text-brand-red-dark">
              Baca Kebijakan Privasi →
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
