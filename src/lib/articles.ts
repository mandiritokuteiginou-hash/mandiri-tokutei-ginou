export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readMinutes: number;
  content: string[];
}

export const ARTICLES: Article[] = [
  {
    slug: "perbedaan-tokutei-ginou-dan-magang-jepang",
    title: "Tokutei Ginou vs Program Magang: Apa Bedanya?",
    excerpt:
      "Banyak calon pekerja bingung membedakan visa Tokutei Ginou (SSW) dengan program magang (Ginou Jisshusei). Berikut penjelasan lengkapnya.",
    category: "Panduan",
    publishedAt: "2026-06-02",
    readMinutes: 4,
    content: [
      "Program magang (Ginou Jisshusei) dirancang sebagai transfer keterampilan, dengan status peserta sebagai 'trainee', bukan pekerja penuh. Durasinya umumnya terbatas dan perpindahan tempat kerja sangat dibatasi.",
      "Tokutei Ginou (特定技能 / Specified Skilled Worker) berbeda: pemegang visa ini berstatus pekerja penuh dengan hak yang setara pekerja lokal Jepang — termasuk gaji layak sesuai standar upah daerah, jaminan sosial, dan perlindungan hukum ketenagakerjaan Jepang.",
      "Dari sisi durasi, Tokutei Ginou kategori SSW-1 memungkinkan masa kerja hingga 5 tahun, dan untuk sektor tertentu bisa melanjutkan ke SSW-2 yang membuka peluang tinggal lebih lama bahkan membawa keluarga.",
      "Kesimpulannya, jika tujuan Anda adalah membangun karier jangka panjang dengan hak kerja yang jelas, jalur Tokutei Ginou umumnya lebih menguntungkan dibanding program magang konvensional.",
    ],
  },
  {
    slug: "persiapan-ujian-jft-basic-dan-jlpt-n4",
    title: "Tips Lulus Ujian JFT-Basic dan JLPT N4 untuk Pemula",
    excerpt:
      "Belum pernah belajar bahasa Jepang sama sekali? Ini strategi belajar yang kami terapkan agar peserta siap ujian dalam beberapa bulan.",
    category: "Tips Belajar",
    publishedAt: "2026-06-18",
    readMinutes: 5,
    content: [
      "JFT-Basic dan JLPT N4 menguji kemampuan dasar berkomunikasi dalam situasi sehari-hari dan di lingkungan kerja. Fokus utama ada pada kosakata praktis, pola kalimat dasar, dan mendengarkan (listening).",
      "Strategi yang kami terapkan: belajar 2 jam per hari dengan kombinasi hafalan kosakata tematik (pekerjaan, kesehatan, transportasi), latihan soal terstruktur, dan sesi percakapan simulasi dengan instruktur.",
      "Gunakan flashcard untuk kanji dan kosakata dasar, dengarkan materi audio berulang untuk membiasakan telinga dengan ritme bicara asli, dan rutin ikut simulasi ujian agar terbiasa dengan format soal sebenarnya.",
      "Yang terpenting adalah konsistensi — peserta yang disiplin belajar setiap hari, meski hanya 30-60 menit tambahan mandiri, terbukti lebih cepat siap ujian dibanding yang belajar tidak teratur.",
    ],
  },
  {
    slug: "dokumen-wajib-pendaftaran-tokutei-ginou",
    title: "Daftar Dokumen Wajib Sebelum Mendaftar Tokutei Ginou",
    excerpt:
      "Siapkan dokumen ini dari awal supaya proses verifikasi berkas Anda berjalan cepat tanpa bolak-balik revisi.",
    category: "Panduan",
    publishedAt: "2026-07-05",
    readMinutes: 3,
    content: [
      "Dokumen dasar yang wajib disiapkan: KTP dan Paspor (atau permohonan pembuatan paspor bila belum punya), ijazah pendidikan terakhir, dan surat keterangan sehat dari fasilitas kesehatan yang diakui.",
      "Untuk kandidat yang sudah bekerja sebelumnya, sertifikat kerja atau surat pengalaman kerja dari sektor terkait dapat mempercepat proses pencocokan dengan perusahaan penerima di Jepang.",
      "Pas foto sesuai standar dokumen keimigrasian Jepang (latar belakang polos, tanpa aksesoris kepala) juga diperlukan sejak tahap awal pendaftaran untuk keperluan administrasi.",
      "Semua dokumen ini dapat diunggah bertahap melalui checklist di Portal Kandidat setelah Anda mendaftar, sehingga tim kami bisa langsung memverifikasi begitu dokumen tersedia.",
    ],
  },
  {
    slug: "kehidupan-pekerja-tokutei-ginou-di-jepang",
    title: "Seperti Apa Kehidupan Sehari-hari Pekerja Tokutei Ginou di Jepang?",
    excerpt:
      "Dari tempat tinggal, biaya hidup, hingga adaptasi budaya kerja — simak gambaran nyata dari kandidat yang sudah bekerja di Jepang.",
    category: "Cerita Alumni",
    publishedAt: "2026-07-22",
    readMinutes: 4,
    content: [
      "Sebagian besar perusahaan penerima menyediakan bantuan pencarian tempat tinggal (asrama karyawan atau apartemen dekat lokasi kerja), sehingga pekerja baru tidak perlu mencari sendiri dari nol saat baru tiba.",
      "Biaya hidup bervariasi tergantung kota, namun umumnya pekerja dapat menyisihkan sebagian besar gaji untuk ditabung atau dikirim ke keluarga di Indonesia setelah dikurangi biaya sewa, makan, dan transportasi.",
      "Adaptasi budaya kerja Jepang — seperti ketepatan waktu, komunikasi formal, dan sistem kerja tim — menjadi bagian penting dari pelatihan pra-keberangkatan agar pekerja lebih siap sejak hari pertama.",
      "Mitra kami di Jepang juga menyediakan pendampingan berkelanjutan untuk membantu pekerja mengatasi kendala adaptasi maupun masalah teknis terkait kontrak kerja selama masa penempatan.",
    ],
  },
];

export function getArticleBySlug(slug: string) {
  return ARTICLES.find((a) => a.slug === slug);
}
