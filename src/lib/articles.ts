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
  {
    slug: "panduan-bulan-pertama-kerja-di-jepang",
    title: "Panduan Bertahan di Bulan Pertama Kerja di Jepang",
    excerpt:
      "Minggu-minggu pertama biasanya paling berat secara mental dan administratif. Ini daftar hal yang perlu Anda urus dan hadapi di awal penempatan.",
    category: "Panduan",
    publishedAt: "2026-08-01",
    readMinutes: 5,
    content: [
      "Dalam 14 hari pertama sejak tiba, Anda wajib mendaftarkan alamat tempat tinggal ke kantor pemerintah setempat (yakuba/shiyakusho) untuk mengaktifkan Kartu Zairyu (Residence Card) sepenuhnya — proses ini biasanya didampingi oleh perusahaan penerima atau organisasi pengawas (supervising organization).",
      "Setelah alamat terdaftar, urus pendaftaran asuransi kesehatan nasional (Kokumin Kenko Hoken) dan sistem pensiun (Nenkin) jika belum otomatis terdaftar melalui perusahaan. Iuran ini dipotong dari gaji namun memberi perlindungan kesehatan penting selama bekerja.",
      "Buka rekening bank Jepang (banyak pekerja menggunakan Japan Post Bank/Yucho karena prosesnya relatif mudah untuk pemegang visa kerja) dan aktifkan nomor telepon lokal — keduanya sering menjadi syarat administrasi lain seperti pembayaran gaji dan pendaftaran layanan.",
      "Secara mental, minggu-minggu awal sering terasa berat karena perbedaan bahasa, ritme kerja, dan rasa rindu keluarga. Ini normal. Manfaatkan grup komunitas pekerja Indonesia di area Anda dan tetap komunikasi rutin dengan pendamping dari agensi maupun tim Mandiri Tokutei Ginou.",
      "Catat baik-baik jam kerja, sistem lembur, dan hari libur perusahaan Anda sejak hari pertama — memahami hak dan kewajiban kontrak sejak awal akan mencegah kesalahpahaman di kemudian hari.",
    ],
  },
  {
    slug: "cara-menabung-dan-kirim-uang-dari-jepang",
    title: "Cara Cerdas Menabung dan Kirim Uang ke Keluarga dari Jepang",
    excerpt:
      "Gaji besar tidak otomatis berarti tabungan besar. Berikut strategi mengatur keuangan yang dipakai kebanyakan pekerja Tokutei Ginou yang sukses menabung.",
    category: "Tips Belajar",
    publishedAt: "2026-08-05",
    readMinutes: 4,
    content: [
      "Langkah pertama adalah membuat anggaran bulanan sederhana: pisahkan gaji ke pos sewa/asrama, makan, transportasi, tabungan wajib, dan kiriman ke keluarga. Banyak pekerja sukses menerapkan aturan menyisihkan minimal 30-40% gaji bersih untuk ditabung atau dikirim pulang.",
      "Untuk transfer ke Indonesia, bandingkan biaya dan kurs antara transfer bank biasa dengan layanan remitansi khusus pekerja migran (seperti Wise, WorldRemit, atau layanan mitra bank lokal) — selisih biaya antar layanan bisa cukup signifikan jika dilakukan rutin setiap bulan.",
      "Masak sendiri dan membawa bekal ke tempat kerja adalah cara paling efektif menekan pengeluaran harian dibanding membeli makan di luar, mengingat biaya makan di Jepang bisa menjadi pos pengeluaran terbesar kedua setelah sewa tempat tinggal.",
      "Manfaatkan diskon musiman dan aplikasi cashback/poin dari supermarket lokal (seperti sistem poin di drugstore dan minimarket) untuk belanja kebutuhan sehari-hari — kebiasaan kecil ini terakumulasi menjadi penghematan berarti dalam setahun.",
      "Terakhir, tetapkan target tabungan jangka panjang sejak awal — baik untuk modal usaha sepulang ke Indonesia, pendidikan keluarga, atau membeli rumah — agar motivasi menabung tetap terjaga meski jauh dari rumah.",
    ],
  },
  {
    slug: "kisah-sukses-alumni-tokutei-ginou-sektor-kaigo",
    title: "Dari Perawat di Kampung ke Tenaga Kaigo di Jepang: Kisah Sukses Alumni Kami",
    excerpt:
      "Perjalanan seorang kandidat dari nol bahasa Jepang hingga bekerja sebagai tenaga perawat lansia (kaigo) di Sapporo — dan apa yang ia pelajari sepanjang jalan.",
    category: "Cerita Alumni",
    publishedAt: "2026-08-08",
    readMinutes: 5,
    content: [
      "Sebelum bergabung dengan program Tokutei Ginou, kandidat kami bekerja sebagai asisten perawat di sebuah klinik kecil di Jawa Tengah tanpa pernah belajar bahasa Jepang sama sekali. Ketertarikannya pada sektor kaigo (perawatan lansia) bermula dari cerita tetangga yang lebih dulu bekerja di Jepang.",
      "Enam bulan pertama dihabiskan untuk persiapan intensif: kelas bahasa Jepang setiap hari, simulasi ujian JFT-Basic, serta pelatihan keterampilan dasar perawatan lansia sesuai standar kerja di Jepang seperti teknik memandikan, memindahkan pasien, dan komunikasi dengan lansia dengan sopan santun (keigo dasar).",
      "Tantangan terbesar bukan hanya bahasa, tetapi menyesuaikan diri dengan standar ketelitian dan dokumentasi kerja di fasilitas perawatan Jepang — setiap tindakan perawatan harus dicatat dengan detail, jauh berbeda dari kebiasaan kerja sebelumnya.",
      "Setelah dinyatakan lolos seleksi dan ditempatkan di sebuah fasilitas perawatan lansia di Sapporo, ia mengaku tiga bulan pertama adalah masa tersulit — namun dukungan dari rekan kerja Jepang dan pendampingan rutin dari tim kami membantunya melewati masa adaptasi.",
      "Kini, setelah lebih dari setahun bekerja, ia telah dipercaya membimbing pekerja baru yang datang dari Indonesia dan tengah mempersiapkan diri untuk ujian kenaikan level bahasa demi membuka peluang perpanjangan kontrak ke SSW-2. Kisahnya menjadi bukti bahwa modal utama bukan kemampuan bahasa yang sempurna sejak awal, melainkan kesungguhan untuk terus belajar.",
    ],
  },
];

export function getArticleBySlug(slug: string) {
  return ARTICLES.find((a) => a.slug === slug);
}
