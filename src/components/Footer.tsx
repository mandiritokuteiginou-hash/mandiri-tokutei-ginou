import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-brand-navy-dark text-neutral-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-red text-xs font-bold text-white">
              MTG
            </span>
            <span className="text-sm font-semibold text-white">
              Mandiri Tokutei Ginou
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-neutral-400">
            Menyiapkan talenta Indonesia menuju karier Tokutei Ginou (Specified
            Skilled Worker) di Jepang secara aman, transparan, dan terarah.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Navigasi</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/program" className="hover:text-white">Program Selengkapnya</Link></li>
            <li><a href="#layanan" className="hover:text-white">Layanan</a></li>
            <li><Link href="/lowongan" className="hover:text-white">Lowongan</Link></li>
            <li><a href="#testimoni" className="hover:text-white">Testimoni</a></li>
            <li><Link href="/artikel" className="hover:text-white">Artikel</Link></li>
            <li><Link href="/materi-belajar" className="hover:text-white">Materi Belajar</Link></li>
            <li><a href="#faq" className="hover:text-white">FAQ</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Akses</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/portal/login" className="hover:text-white">Portal Kandidat</Link></li>
            <li><Link href="/portal/register" className="hover:text-white">Daftar Kandidat</Link></li>
            <li><Link href="/admin/login" className="hover:text-white">Login Admin</Link></li>
          </ul>
        </div>

        <div id="kontak">
          <h3 className="text-sm font-semibold text-white">Kontak</h3>
          <ul className="mt-3 space-y-2 text-sm text-neutral-400">
            <li>Jl. Sudirman No. 123, Jakarta Selatan</li>
            <li>+62 812-3456-7890 (WhatsApp)</li>
            <li>info@mandiritokuteiginou.id</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center text-xs text-neutral-500">
          <span>© {new Date().getFullYear()} Mandiri Tokutei Ginou. Seluruh hak cipta dilindungi.</span>
          <Link href="/kebijakan-privasi" className="hover:text-neutral-300">Kebijakan Privasi</Link>
          <Link href="/syarat-ketentuan" className="hover:text-neutral-300">Syarat &amp; Ketentuan</Link>
        </div>
      </div>
    </footer>
  );
}
