export interface VocabEntry {
  jp: string;
  romaji: string;
  id: string;
}

export interface LearningMaterial {
  slug: string;
  title: string;
  category: string;
  level: string;
  excerpt: string;
  intro: string[];
  vocab?: VocabEntry[];
  tips?: string[];
}

export const MATERIALS: LearningMaterial[] = [
  {
    slug: "sapaan-percakapan-sehari-hari",
    title: "Sapaan & Percakapan Dasar Sehari-hari",
    category: "Bahasa Jepang Dasar",
    level: "N5",
    excerpt:
      "Kalimat sapaan dan ungkapan paling sering dipakai di lingkungan kerja Jepang — modal awal sebelum masuk kosakata per sektor.",
    intro: [
      "Sebelum mempelajari kosakata khusus sektor kerja, kuasai dulu sapaan dan ungkapan dasar ini. Kalimat-kalimat berikut akan Anda dengar dan pakai setiap hari di tempat kerja Jepang, dari pagi hingga pulang kerja.",
      "Tips: ucapkan お疲れ様です (otsukaresama desu) setiap kali berpapasan dengan rekan kerja yang baru selesai bertugas atau saat pulang — ini sapaan wajib di budaya kerja Jepang, bukan sekadar basa-basi.",
    ],
    vocab: [
      { jp: "おはようございます", romaji: "ohayou gozaimasu", id: "Selamat pagi (formal)" },
      { jp: "こんにちは", romaji: "konnichiwa", id: "Selamat siang" },
      { jp: "こんばんは", romaji: "konbanwa", id: "Selamat malam" },
      { jp: "お疲れ様です", romaji: "otsukaresama desu", id: "Terima kasih atas kerja kerasnya (sapaan antar rekan kerja)" },
      { jp: "よろしくお願いします", romaji: "yoroshiku onegaishimasu", id: "Mohon bantuannya / senang bekerja sama" },
      { jp: "すみません", romaji: "sumimasen", id: "Permisi / maaf" },
      { jp: "ありがとうございます", romaji: "arigatou gozaimasu", id: "Terima kasih" },
      { jp: "わかりました", romaji: "wakarimashita", id: "Mengerti, paham" },
      { jp: "大丈夫です", romaji: "daijoubu desu", id: "Tidak apa-apa, baik-baik saja" },
      { jp: "お先に失礼します", romaji: "osaki ni shitsurei shimasu", id: "Permisi, saya pulang duluan" },
    ],
  },
  {
    slug: "kosakata-kerja-kaigo",
    title: "Kosakata Kerja: Perawatan Lansia (Kaigo)",
    category: "Kosakata per Sektor",
    level: "N4",
    excerpt:
      "Istilah yang paling sering dipakai saat membantu aktivitas sehari-hari lansia — makan, mandi, dan mobilitas.",
    intro: [
      "Sektor Kaigo (perawatan lansia) menuntut komunikasi yang jelas dan sopan, baik dengan lansia (利用者 / riyousha) maupun sesama staf. Kosakata berikut sering muncul dalam serah-terima tugas dan laporan harian.",
    ],
    vocab: [
      { jp: "利用者", romaji: "riyousha", id: "Pengguna layanan / lansia yang dirawat" },
      { jp: "食事介助", romaji: "shokuji kaijo", id: "Bantuan makan" },
      { jp: "入浴介助", romaji: "nyuuyoku kaijo", id: "Bantuan mandi" },
      { jp: "排泄介助", romaji: "haisetsu kaijo", id: "Bantuan ke toilet" },
      { jp: "車椅子", romaji: "kurumaisu", id: "Kursi roda" },
      { jp: "転倒", romaji: "tentou", id: "Jatuh / terjatuh" },
      { jp: "体温", romaji: "taion", id: "Suhu tubuh" },
      { jp: "血圧", romaji: "ketsuatsu", id: "Tekanan darah" },
      { jp: "職員", romaji: "shokuin", id: "Staf / karyawan" },
      { jp: "記録", romaji: "kiroku", id: "Catatan / rekam medis harian" },
    ],
  },
  {
    slug: "kosakata-kerja-konstruksi",
    title: "Kosakata Kerja: Konstruksi",
    category: "Kosakata per Sektor",
    level: "N4",
    excerpt:
      "Istilah keselamatan kerja dan peralatan yang wajib dipahami sebelum turun ke lokasi proyek konstruksi.",
    intro: [
      "Keselamatan kerja (安全 / anzen) adalah prioritas utama di sektor konstruksi. Pahami istilah-istilah ini sebelum hari pertama kerja — banyak dari kata ini akan muncul di papan pengumuman dan briefing pagi (朝礼 / chourei).",
    ],
    vocab: [
      { jp: "現場", romaji: "genba", id: "Lokasi kerja / lapangan proyek" },
      { jp: "安全第一", romaji: "anzen daiichi", id: "Keselamatan nomor satu" },
      { jp: "ヘルメット", romaji: "herumetto", id: "Helm" },
      { jp: "危険", romaji: "kiken", id: "Bahaya" },
      { jp: "作業員", romaji: "sagyouin", id: "Pekerja" },
      { jp: "鉄筋", romaji: "tekkin", id: "Besi tulangan (rebar)" },
      { jp: "足場", romaji: "ashiba", id: "Perancah (scaffolding)" },
      { jp: "図面", romaji: "zumen", id: "Gambar kerja / blueprint" },
      { jp: "重機", romaji: "juuki", id: "Alat berat" },
      { jp: "残業", romaji: "zangyou", id: "Lembur" },
    ],
  },
  {
    slug: "kosakata-kerja-manufaktur",
    title: "Kosakata Kerja: Manufaktur",
    category: "Kosakata per Sektor",
    level: "N4",
    excerpt:
      "Istilah operasional lini produksi dan kontrol kualitas yang sering dipakai di pabrik.",
    intro: [
      "Sektor manufaktur menuntut ketelitian dan kedisiplinan mengikuti standar operasional (SOP). Kosakata berikut sering muncul di lini produksi dan laporan kualitas harian.",
    ],
    vocab: [
      { jp: "工場", romaji: "koujou", id: "Pabrik" },
      { jp: "機械", romaji: "kikai", id: "Mesin" },
      { jp: "部品", romaji: "buhin", id: "Komponen / suku cadang" },
      { jp: "検査", romaji: "kensa", id: "Inspeksi / pemeriksaan" },
      { jp: "生産ライン", romaji: "seisan rain", id: "Lini produksi" },
      { jp: "不良品", romaji: "furyouhin", id: "Barang cacat" },
      { jp: "品質管理", romaji: "hinshitsu kanri", id: "Kontrol kualitas (QC)" },
      { jp: "組み立て", romaji: "kumitate", id: "Perakitan" },
      { jp: "在庫", romaji: "zaiko", id: "Stok / inventaris" },
      { jp: "交代制", romaji: "koutaisei", id: "Sistem kerja shift" },
    ],
  },
  {
    slug: "kosakata-kerja-perikanan",
    title: "Kosakata Kerja: Perikanan",
    category: "Kosakata per Sektor",
    level: "N4",
    excerpt:
      "Istilah di atas kapal dan fasilitas budidaya yang wajib dipahami sebelum bekerja di sektor perikanan.",
    intro: [
      "Bekerja di sektor perikanan (漁業 / gyogyou) bisa berarti bekerja di kapal penangkap ikan atau fasilitas budidaya (養殖 / youshoku). Kosakata berikut mencakup keduanya, termasuk istilah keselamatan di laut.",
    ],
    vocab: [
      { jp: "漁業", romaji: "gyogyou", id: "Perikanan" },
      { jp: "漁船", romaji: "gyosen", id: "Kapal ikan" },
      { jp: "網", romaji: "ami", id: "Jaring" },
      { jp: "水揚げ", romaji: "mizuage", id: "Bongkar muat hasil tangkapan" },
      { jp: "養殖", romaji: "youshoku", id: "Budidaya (akuakultur)" },
      { jp: "冷凍", romaji: "reitou", id: "Pembekuan" },
      { jp: "出港", romaji: "shukkou", id: "Berangkat dari pelabuhan" },
      { jp: "帰港", romaji: "kikou", id: "Kembali ke pelabuhan" },
      { jp: "救命胴衣", romaji: "kyuumei doui", id: "Jaket pelampung (life vest)" },
      { jp: "天候", romaji: "tenkou", id: "Cuaca / kondisi laut" },
    ],
  },
  {
    slug: "kosakata-kerja-pertanian",
    title: "Kosakata Kerja: Pertanian",
    category: "Kosakata per Sektor",
    level: "N4",
    excerpt:
      "Istilah lahan, tanam, dan panen yang sering dipakai di sektor pertanian Jepang.",
    intro: [
      "Sektor pertanian (農業 / nougyou) di Jepang banyak memakai rumah kaca modern (ビニールハウス) dan alat mekanis. Kosakata berikut mencakup siklus tanam hingga panen.",
    ],
    vocab: [
      { jp: "農業", romaji: "nougyou", id: "Pertanian" },
      { jp: "畑", romaji: "hatake", id: "Ladang" },
      { jp: "収穫", romaji: "shuukaku", id: "Panen" },
      { jp: "種まき", romaji: "tanemaki", id: "Menanam benih" },
      { jp: "肥料", romaji: "hiryou", id: "Pupuk" },
      { jp: "農薬", romaji: "nouyaku", id: "Pestisida" },
      { jp: "ビニールハウス", romaji: "biniiru hausu", id: "Rumah kaca (greenhouse)" },
      { jp: "トラクター", romaji: "torakutaa", id: "Traktor" },
      { jp: "出荷", romaji: "shukka", id: "Pengiriman hasil panen" },
      { jp: "天気", romaji: "tenki", id: "Cuaca" },
    ],
  },
  {
    slug: "kosakata-kerja-perhotelan-food-service",
    title: "Kosakata Kerja: Perhotelan & Food Service",
    category: "Kosakata per Sektor",
    level: "N4",
    excerpt:
      "Istilah pelayanan tamu, pemesanan, dan kebersihan yang sering dipakai di hotel dan restoran.",
    intro: [
      "Sektor perhotelan dan food service menuntut komunikasi ramah dan sopan dengan tamu (お客様 / okyakusama). Kosakata berikut sering dipakai saat menyambut, melayani, dan membersihkan area kerja.",
    ],
    vocab: [
      { jp: "接客", romaji: "sekkyaku", id: "Melayani tamu" },
      { jp: "お客様", romaji: "okyakusama", id: "Tamu / pelanggan (bentuk sopan)" },
      { jp: "注文", romaji: "chuumon", id: "Pesanan" },
      { jp: "配膳", romaji: "haizen", id: "Menyajikan makanan" },
      { jp: "予約", romaji: "yoyaku", id: "Reservasi" },
      { jp: "チェックイン", romaji: "chekku in", id: "Check-in" },
      { jp: "清掃", romaji: "seisou", id: "Pembersihan" },
      { jp: "衛生管理", romaji: "eisei kanri", id: "Manajemen kebersihan / higienitas" },
      { jp: "レジ", romaji: "reji", id: "Kasir" },
      { jp: "満室", romaji: "manshitsu", id: "Kamar penuh (fully booked)" },
    ],
  },
  {
    slug: "frasa-wawancara-kerja",
    title: "Frasa Wajib untuk Wawancara Kerja",
    category: "Persiapan Wawancara",
    level: "N4-N5",
    excerpt:
      "Kalimat pembuka, penutup, dan jawaban umum yang bisa dipakai saat wawancara dengan perusahaan penerima di Jepang.",
    intro: [
      "Wawancara kerja untuk posisi Tokutei Ginou biasanya dilakukan online dan bisa berlangsung singkat. Latih kalimat-kalimat berikut sampai lancar — pewawancara menilai kepercayaan diri sama pentingnya dengan jawaban itu sendiri.",
    ],
    vocab: [
      { jp: "自己紹介をお願いします", romaji: "jiko shoukai wo onegaishimasu", id: "(Pewawancara) Tolong perkenalkan diri Anda" },
      { jp: "私は〜です", romaji: "watashi wa ~ desu", id: "Saya adalah ~ (nama)" },
      { jp: "インドネシアから来ました", romaji: "Indoneshia kara kimashita", id: "Saya datang dari Indonesia" },
      { jp: "頑張ります", romaji: "ganbarimasu", id: "Saya akan berusaha sebaik mungkin" },
      { jp: "ご質問はありますか", romaji: "go shitsumon wa arimasu ka", id: "(Pewawancara) Ada pertanyaan?" },
      { jp: "質問がありません", romaji: "shitsumon ga arimasen", id: "Tidak ada pertanyaan" },
      { jp: "よろしくお願いいたします", romaji: "yoroshiku onegai itashimasu", id: "Mohon bimbingannya (penutup, sangat sopan)" },
    ],
    tips: [
      "Latih perkenalan diri (nama, asal, pengalaman kerja, alasan melamar) sampai bisa diucapkan tanpa membaca teks.",
      "Selalu siapkan 1-2 pertanyaan balik untuk pewawancara — menjawab \"tidak ada pertanyaan\" terus-menerus bisa terkesan kurang antusias.",
      "Gunakan bentuk です/ます (sopan standar) sepanjang wawancara, bukan bentuk kasual.",
    ],
  },
  {
    slug: "keigo-dasar-tempat-kerja",
    title: "Keigo Dasar: Bahasa Sopan di Tempat Kerja",
    category: "Tata Bahasa",
    level: "N3-N4",
    excerpt:
      "Pengenalan keigo (敬語) — tingkatan bahasa sopan yang dipakai saat berbicara dengan atasan, senior, atau tamu.",
    intro: [
      "Keigo adalah sistem bahasa sopan dalam bahasa Jepang yang dipakai untuk menunjukkan rasa hormat kepada lawan bicara — wajib dikuasai bertahap saat bekerja di Jepang, terutama untuk komunikasi dengan atasan (上司 / joushi) dan tamu.",
      "Untuk pemula, cukup kuasai dulu bentuk です/ます (standar sopan) dengan konsisten. Beberapa ungkapan keigo umum di bawah ini sering didengar dari senior atau digunakan saat melayani tamu.",
    ],
    vocab: [
      { jp: "いたします", romaji: "itashimasu", id: "Bentuk merendah dari \"melakukan\" (suru)" },
      { jp: "申します", romaji: "moushimasu", id: "Bentuk merendah dari \"mengatakan/bernama\" (iu)" },
      { jp: "ご覧ください", romaji: "goran kudasai", id: "Silakan lihat (sopan kepada tamu/atasan)" },
      { jp: "かしこまりました", romaji: "kashikomarimashita", id: "Baik, saya mengerti (sangat sopan)" },
      { jp: "おっしゃる通りです", romaji: "ossharu toori desu", id: "Benar seperti yang Anda katakan" },
    ],
    tips: [
      "Jangan terburu-buru menguasai keigo tingkat tinggi — fokus dulu pada です/ます yang konsisten, itu sudah cukup sopan untuk kebanyakan situasi kerja sehari-hari.",
      "Perhatikan dan tiru cara senior berbicara kepada atasan; keigo lebih mudah dipelajari lewat contoh langsung daripada hafalan.",
    ],
  },
  {
    slug: "budaya-kerja-jepang",
    title: "Budaya Kerja Jepang yang Perlu Diketahui Sebelum Berangkat",
    category: "Adaptasi Budaya",
    level: "Semua level",
    excerpt:
      "Kebiasaan dan etika kerja di Jepang yang sering berbeda dari Indonesia — penting dipahami sejak sebelum keberangkatan.",
    intro: [
      "Selain kemampuan bahasa dan skill teknis, adaptasi budaya kerja adalah kunci sukses bekerja di Jepang. Berikut kebiasaan yang paling sering mengejutkan pekerja baru.",
    ],
    tips: [
      "Ketepatan waktu: usahakan tiba 10-15 menit sebelum jam kerja dimulai, bukan tepat waktu.",
      "Hourensou (報連相): budaya lapor (houkoku), kontak (renraku), dan konsultasi (soudan) ke atasan sebelum mengambil keputusan sendiri — sangat dihargai di tempat kerja Jepang.",
      "Ojigi (membungkuk): gunakan sebagai bentuk salam dan terima kasih, terutama kepada atasan dan tamu.",
      "Sistem senpai-kohai: hormati senior (senpai) meski usianya lebih muda dari Anda — senioritas di Jepang didasarkan pada lama bekerja, bukan usia.",
      "Membaca situasi (kuuki wo yomu): komunikasi di Jepang sering tidak langsung; perhatikan konteks dan nada bicara, jangan hanya kata-kata literalnya.",
      "Kebersihan tempat kerja adalah tanggung jawab bersama, termasuk area yang bukan tugas spesifik Anda (souji/pembersihan rutin).",
    ],
  },
];

export function getMaterialBySlug(slug: string) {
  return MATERIALS.find((m) => m.slug === slug);
}
