export interface VocabEntry {
  jp: string;
  romaji: string;
  id: string;
}

export interface CharEntry {
  char: string;
  romaji: string;
}

export interface ExampleSentence {
  jp: string;
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
  chart?: CharEntry[];
  examples?: ExampleSentence[];
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
    slug: "hiragana-dasar",
    title: "Hiragana Dasar",
    category: "Bahasa Jepang Dasar",
    level: "N5",
    excerpt:
      "46 huruf hiragana dasar (gojuon) — huruf pertama yang wajib dikuasai sebelum belajar kosakata dan kalimat.",
    intro: [
      "Hiragana (ひらがな) adalah huruf dasar bahasa Jepang yang dipakai untuk kata-kata asli Jepang, partikel tata bahasa, dan akhiran kata kerja. Semua materi belajar di halaman ini ditulis dengan bantuan hiragana, jadi kuasai dulu 46 huruf berikut sebelum lanjut ke modul lain.",
      "Cara belajar paling efektif: tulis ulang setiap huruf berkali-kali sambil mengucapkan bunyinya, lalu coba baca kosakata sederhana yang memakainya.",
    ],
    chart: [
      { char: "あ", romaji: "a" }, { char: "い", romaji: "i" }, { char: "う", romaji: "u" }, { char: "え", romaji: "e" }, { char: "お", romaji: "o" },
      { char: "か", romaji: "ka" }, { char: "き", romaji: "ki" }, { char: "く", romaji: "ku" }, { char: "け", romaji: "ke" }, { char: "こ", romaji: "ko" },
      { char: "さ", romaji: "sa" }, { char: "し", romaji: "shi" }, { char: "す", romaji: "su" }, { char: "せ", romaji: "se" }, { char: "そ", romaji: "so" },
      { char: "た", romaji: "ta" }, { char: "ち", romaji: "chi" }, { char: "つ", romaji: "tsu" }, { char: "て", romaji: "te" }, { char: "と", romaji: "to" },
      { char: "な", romaji: "na" }, { char: "に", romaji: "ni" }, { char: "ぬ", romaji: "nu" }, { char: "ね", romaji: "ne" }, { char: "の", romaji: "no" },
      { char: "は", romaji: "ha" }, { char: "ひ", romaji: "hi" }, { char: "ふ", romaji: "fu" }, { char: "へ", romaji: "he" }, { char: "ほ", romaji: "ho" },
      { char: "ま", romaji: "ma" }, { char: "み", romaji: "mi" }, { char: "む", romaji: "mu" }, { char: "め", romaji: "me" }, { char: "も", romaji: "mo" },
      { char: "や", romaji: "ya" }, { char: "ゆ", romaji: "yu" }, { char: "よ", romaji: "yo" },
      { char: "ら", romaji: "ra" }, { char: "り", romaji: "ri" }, { char: "る", romaji: "ru" }, { char: "れ", romaji: "re" }, { char: "ろ", romaji: "ro" },
      { char: "わ", romaji: "wa" }, { char: "を", romaji: "wo" },
      { char: "ん", romaji: "n" },
    ],
    tips: [
      "Huruf hiragana yang sering tertukar: し (shi) vs ち (chi), つ (tsu) vs す (su) — perhatikan bentuk goresannya baik-baik.",
      "Setelah hafal 46 huruf dasar ini, lanjut ke variasi dakuten (が/ざ/だ/ば) dan youon (きゃ/しゃ/ちゃ) yang biasanya diajarkan di kelas persiapan.",
    ],
  },
  {
    slug: "katakana-dasar",
    title: "Katakana Dasar",
    category: "Bahasa Jepang Dasar",
    level: "N5",
    excerpt:
      "46 huruf katakana dasar — dipakai untuk menulis kata serapan asing, nama negara, dan istilah teknis/mesin di tempat kerja.",
    intro: [
      "Katakana (カタカナ) punya bunyi yang sama persis dengan hiragana, tapi bentuk hurufnya berbeda dan dipakai khusus untuk kata serapan dari bahasa asing (mis. ヘルメット / herumetto = helm) serta nama negara seperti インドネシア (Indoneshia). Di tempat kerja, banyak istilah alat dan mesin ditulis dalam katakana.",
    ],
    chart: [
      { char: "ア", romaji: "a" }, { char: "イ", romaji: "i" }, { char: "ウ", romaji: "u" }, { char: "エ", romaji: "e" }, { char: "オ", romaji: "o" },
      { char: "カ", romaji: "ka" }, { char: "キ", romaji: "ki" }, { char: "ク", romaji: "ku" }, { char: "ケ", romaji: "ke" }, { char: "コ", romaji: "ko" },
      { char: "サ", romaji: "sa" }, { char: "シ", romaji: "shi" }, { char: "ス", romaji: "su" }, { char: "セ", romaji: "se" }, { char: "ソ", romaji: "so" },
      { char: "タ", romaji: "ta" }, { char: "チ", romaji: "chi" }, { char: "ツ", romaji: "tsu" }, { char: "テ", romaji: "te" }, { char: "ト", romaji: "to" },
      { char: "ナ", romaji: "na" }, { char: "ニ", romaji: "ni" }, { char: "ヌ", romaji: "nu" }, { char: "ネ", romaji: "ne" }, { char: "ノ", romaji: "no" },
      { char: "ハ", romaji: "ha" }, { char: "ヒ", romaji: "hi" }, { char: "フ", romaji: "fu" }, { char: "ヘ", romaji: "he" }, { char: "ホ", romaji: "ho" },
      { char: "マ", romaji: "ma" }, { char: "ミ", romaji: "mi" }, { char: "ム", romaji: "mu" }, { char: "メ", romaji: "me" }, { char: "モ", romaji: "mo" },
      { char: "ヤ", romaji: "ya" }, { char: "ユ", romaji: "yu" }, { char: "ヨ", romaji: "yo" },
      { char: "ラ", romaji: "ra" }, { char: "リ", romaji: "ri" }, { char: "ル", romaji: "ru" }, { char: "レ", romaji: "re" }, { char: "ロ", romaji: "ro" },
      { char: "ワ", romaji: "wa" }, { char: "ヲ", romaji: "wo" },
      { char: "ン", romaji: "n" },
    ],
    tips: [
      "Huruf katakana yang sering tertukar: シ (shi) vs ツ (tsu), ソ (so) vs ン (n) — perhatikan arah goresan terakhirnya.",
      "Coba baca nama negara dan kota dalam katakana: インドネシア (Indonesia), ジャカルタ (Jakarta), オオサカ (Osaka).",
    ],
  },
  {
    slug: "angka-hari-waktu",
    title: "Angka, Hari & Waktu",
    category: "Bahasa Jepang Dasar",
    level: "N5",
    excerpt:
      "Kosakata angka, hari dalam seminggu, dan ungkapan waktu — dipakai setiap hari untuk memahami jadwal dan shift kerja.",
    intro: [
      "Memahami angka dan waktu sangat penting sejak hari pertama kerja — untuk membaca jadwal shift, jam istirahat, dan tanggal penting. Bahasa Jepang punya dua cara membaca beberapa angka (mis. 4 = yon/shi, 7 = nana/shichi); pelajari keduanya karena sama-sama umum dipakai.",
    ],
    vocab: [
      { jp: "一", romaji: "ichi", id: "Satu (1)" },
      { jp: "二", romaji: "ni", id: "Dua (2)" },
      { jp: "三", romaji: "san", id: "Tiga (3)" },
      { jp: "四", romaji: "yon / shi", id: "Empat (4)" },
      { jp: "五", romaji: "go", id: "Lima (5)" },
      { jp: "六", romaji: "roku", id: "Enam (6)" },
      { jp: "七", romaji: "nana / shichi", id: "Tujuh (7)" },
      { jp: "八", romaji: "hachi", id: "Delapan (8)" },
      { jp: "九", romaji: "kyuu", id: "Sembilan (9)" },
      { jp: "十", romaji: "juu", id: "Sepuluh (10)" },
      { jp: "月曜日", romaji: "getsuyoubi", id: "Senin" },
      { jp: "火曜日", romaji: "kayoubi", id: "Selasa" },
      { jp: "水曜日", romaji: "suiyoubi", id: "Rabu" },
      { jp: "木曜日", romaji: "mokuyoubi", id: "Kamis" },
      { jp: "金曜日", romaji: "kinyoubi", id: "Jumat" },
      { jp: "土曜日", romaji: "doyoubi", id: "Sabtu" },
      { jp: "日曜日", romaji: "nichiyoubi", id: "Minggu" },
      { jp: "今日", romaji: "kyou", id: "Hari ini" },
      { jp: "明日", romaji: "ashita", id: "Besok" },
      { jp: "昨日", romaji: "kinou", id: "Kemarin" },
      { jp: "何時", romaji: "nanji", id: "Jam berapa" },
    ],
  },
  {
    slug: "partikel-dasar",
    title: "Partikel Dasar: は・が・を・に・で・の",
    category: "Tata Bahasa",
    level: "N5",
    excerpt:
      "Enam partikel yang paling sering dipakai dan menentukan struktur kalimat dasar bahasa Jepang.",
    intro: [
      "Partikel (助詞 / joshi) adalah kata kecil yang menandai fungsi kata di depannya dalam kalimat — mirip \"di\", \"ke\", \"dari\" dalam bahasa Indonesia, tapi peletakannya SETELAH kata, bukan sebelum. Enam partikel berikut sudah cukup untuk membentuk kalimat dasar sehari-hari.",
    ],
    tips: [
      "は (dibaca \"wa\" saat jadi partikel) — menandai topik kalimat. Contoh: 私は学生です (watashi wa gakusei desu) = Saya adalah pelajar.",
      "が (ga) — menandai subjek, sering dipakai saat memperkenalkan info baru. Contoh: 田中さんが来ました (Tanaka-san ga kimashita) = Pak/Bu Tanaka datang.",
      "を (dibaca \"o\" saat jadi partikel) — menandai objek langsung. Contoh: ご飯を食べます (gohan wo tabemasu) = Makan nasi.",
      "に (ni) — menandai waktu, tujuan, atau arah. Contoh: 7時に始まります (shichiji ni hajimarimasu) = Dimulai jam 7.",
      "で (de) — menandai lokasi terjadinya aktivitas atau alat/cara. Contoh: 工場で働きます (koujou de hatarakimasu) = Bekerja di pabrik.",
      "の (no) — menandai kepemilikan, mirip \"-nya\" atau \"milik\". Contoh: 私の名前 (watashi no namae) = Nama saya.",
    ],
    examples: [
      { jp: "私はインドネシア人です。", id: "Saya adalah orang Indonesia." },
      { jp: "明日、工場で働きます。", id: "Besok, saya bekerja di pabrik." },
      { jp: "8時に会社に着きます。", id: "Saya tiba di perusahaan jam 8." },
    ],
  },
  {
    slug: "kata-kerja-dasar",
    title: "Kata Kerja Dasar: Bentuk -masu, Negatif & Lampau",
    category: "Tata Bahasa",
    level: "N5",
    excerpt:
      "Cara mengubah kata kerja ke bentuk positif, negatif, dan lampau — pola paling sering dipakai dalam percakapan kerja sehari-hari.",
    intro: [
      "Bentuk ~masu (~ます) adalah bentuk sopan standar kata kerja bahasa Jepang, dipakai di hampir semua situasi formal termasuk tempat kerja. Empat pola dasar berikut cukup untuk menyusun kalimat tentang aktivitas kerja sehari-hari, baik sekarang, nanti, maupun yang sudah lewat.",
    ],
    vocab: [
      { jp: "食べます", romaji: "tabemasu", id: "Makan (sekarang/akan datang)" },
      { jp: "食べません", romaji: "tabemasen", id: "Tidak makan" },
      { jp: "食べました", romaji: "tabemashita", id: "Sudah makan (lampau)" },
      { jp: "食べませんでした", romaji: "tabemasendeshita", id: "Tidak makan (lampau)" },
      { jp: "働きます", romaji: "hatarakimasu", id: "Bekerja" },
      { jp: "行きます", romaji: "ikimasu", id: "Pergi" },
      { jp: "来ます", romaji: "kimasu", id: "Datang" },
      { jp: "します", romaji: "shimasu", id: "Melakukan" },
      { jp: "あります", romaji: "arimasu", id: "Ada (untuk benda mati)" },
      { jp: "います", romaji: "imasu", id: "Ada (untuk orang/makhluk hidup)" },
    ],
    tips: [
      "Pola: [kata kerja]ます = positif sekarang/akan datang, [kata kerja]ません = negatif, [kata kerja]ました = positif lampau, [kata kerja]ませんでした = negatif lampau.",
      "Bahasa Jepang tidak membedakan \"sekarang\" dan \"akan datang\" dalam bentuk kata kerja — konteks kalimat (mis. kata 明日/besok) yang menentukan waktunya.",
    ],
    examples: [
      { jp: "毎日、7時に働きます。", id: "Setiap hari, saya bekerja jam 7." },
      { jp: "昨日は残業しませんでした。", id: "Kemarin saya tidak lembur." },
    ],
  },
  {
    slug: "kata-sifat-i-na",
    title: "Kata Sifat: Adjektiva -i dan -na",
    category: "Tata Bahasa",
    level: "N5",
    excerpt:
      "Dua kelompok kata sifat dalam bahasa Jepang dan cara memakainya dalam kalimat sehari-hari.",
    intro: [
      "Kata sifat bahasa Jepang terbagi dua kelompok: adjektiva -i (berakhiran い, seperti 大きい/besar) dan adjektiva -na (perlu tambahan な sebelum kata benda, seperti 元気な人/orang yang sehat). Keduanya sering dipakai untuk menjelaskan kondisi kerja, suasana hati, dan situasi sehari-hari.",
    ],
    vocab: [
      { jp: "大きい", romaji: "ookii", id: "Besar (adjektiva -i)" },
      { jp: "小さい", romaji: "chiisai", id: "Kecil (adjektiva -i)" },
      { jp: "忙しい", romaji: "isogashii", id: "Sibuk (adjektiva -i)" },
      { jp: "難しい", romaji: "muzukashii", id: "Sulit (adjektiva -i)" },
      { jp: "楽しい", romaji: "tanoshii", id: "Menyenangkan (adjektiva -i)" },
      { jp: "元気な", romaji: "genki na", id: "Sehat, semangat (adjektiva -na)" },
      { jp: "大丈夫な", romaji: "daijoubu na", id: "Baik-baik saja (adjektiva -na)" },
      { jp: "静かな", romaji: "shizuka na", id: "Tenang (adjektiva -na)" },
      { jp: "便利な", romaji: "benri na", id: "Praktis, berguna (adjektiva -na)" },
      { jp: "親切な", romaji: "shinsetsu na", id: "Ramah, baik hati (adjektiva -na)" },
    ],
    tips: [
      "Adjektiva -i berdiri sendiri sebelum kata benda: 大きい荷物 (ookii nimotsu) = barang yang besar.",
      "Adjektiva -na butuh tambahan な sebelum kata benda: 元気な人 (genki na hito) = orang yang sehat/semangat — tapi tanpa な di akhir kalimat: 彼は元気です (kare wa genki desu) = Dia sehat.",
    ],
  },
  {
    slug: "kata-tanya-dasar",
    title: "Kata Tanya Dasar",
    category: "Tata Bahasa",
    level: "N5",
    excerpt:
      "Kata tanya yang paling sering dipakai untuk bertanya soal pekerjaan, jadwal, dan situasi sehari-hari.",
    intro: [
      "Menguasai kata tanya dasar membuat Anda bisa bertanya dan memahami instruksi di tempat kerja, misalnya soal jadwal, lokasi, atau prosedur. Semua kata tanya berikut biasanya diikuti partikel か (ka) di akhir kalimat untuk menandai kalimat tanya.",
    ],
    vocab: [
      { jp: "何", romaji: "nani / nan", id: "Apa" },
      { jp: "どこ", romaji: "doko", id: "Di mana" },
      { jp: "いつ", romaji: "itsu", id: "Kapan" },
      { jp: "誰", romaji: "dare", id: "Siapa" },
      { jp: "なぜ / どうして", romaji: "naze / doushite", id: "Mengapa" },
      { jp: "どう", romaji: "dou", id: "Bagaimana" },
      { jp: "いくら", romaji: "ikura", id: "Berapa (harga)" },
      { jp: "いくつ", romaji: "ikutsu", id: "Berapa (jumlah)" },
    ],
    examples: [
      { jp: "これは何ですか。", id: "Ini apa?" },
      { jp: "トイレはどこですか。", id: "Toilet di mana?" },
      { jp: "休憩はいつですか。", id: "Istirahat kapan?" },
    ],
  },
  {
    slug: "kata-bantu-bilangan",
    title: "Menghitung Benda: Kata Bantu Bilangan (Josuushi)",
    category: "Tata Bahasa",
    level: "N4-N5",
    excerpt:
      "Kata bantu bilangan (counter) yang berubah tergantung jenis benda yang dihitung — salah satu ciri khas bahasa Jepang.",
    intro: [
      "Berbeda dari bahasa Indonesia, bahasa Jepang memakai kata bantu bilangan (josuushi) yang berbeda tergantung jenis benda yang dihitung — orang, benda tipis, benda panjang, mesin, dan sebagainya. Pelajari yang paling sering dipakai di tempat kerja berikut.",
    ],
    vocab: [
      { jp: "一つ", romaji: "hitotsu", id: "Satu buah (benda umum, hitungan universal)" },
      { jp: "一人", romaji: "hitori", id: "Satu orang" },
      { jp: "二人", romaji: "futari", id: "Dua orang" },
      { jp: "三人", romaji: "sannin", id: "Tiga orang (mulai 3, pola \"angka+nin\" beraturan)" },
      { jp: "一枚", romaji: "ichimai", id: "Satu lembar (kertas, baju, benda tipis)" },
      { jp: "一本", romaji: "ippon", id: "Satu batang (pulpen, botol, benda panjang)" },
      { jp: "一個", romaji: "ikko", id: "Satu buah (benda kecil bulat)" },
      { jp: "一台", romaji: "ichidai", id: "Satu unit (mesin, kendaraan)" },
      { jp: "一回", romaji: "ikkai", id: "Satu kali" },
      { jp: "一時間", romaji: "ichijikan", id: "Satu jam (durasi)" },
    ],
    tips: [
      "Untuk benda umum yang tidak punya counter khusus, gunakan hitungan universal: 一つ・二つ・三つ (hitotsu, futatsu, mittsu) dan seterusnya sampai 十 (too).",
      "Bacaan angka bisa berubah tergantung counter-nya (mis. 一本 dibaca \"ippon\", bukan \"ichihon\") — hafalkan pola ini bertahap lewat latihan, bukan hafalan sekaligus.",
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
