export interface GalleryItem {
  caption: string;
  place: string;
  icon: string;
  gradient: string;
  span?: "tall" | "wide";
}

export const GALLERY: GalleryItem[] = [
  {
    caption: "Kelas Persiapan Bahasa Jepang",
    place: "Pusat Pelatihan Jakarta",
    icon: "📚",
    gradient: "from-brand-red to-brand-red-dark",
    span: "tall",
  },
  {
    caption: "Simulasi Ujian Skill Sektor",
    place: "Pusat Pelatihan Jakarta",
    icon: "🛠️",
    gradient: "from-brand-navy to-brand-navy-dark",
  },
  {
    caption: "Sesi Wawancara dengan Perusahaan Jepang",
    place: "Online / Onsite",
    icon: "🤝",
    gradient: "from-brand-gold to-brand-red",
  },
  {
    caption: "Wisuda & Pelepasan Kandidat",
    place: "Jakarta",
    icon: "🎓",
    gradient: "from-brand-navy to-brand-red-dark",
    span: "wide",
  },
  {
    caption: "Hari Keberangkatan ke Jepang",
    place: "Bandara Soekarno-Hatta",
    icon: "✈️",
    gradient: "from-brand-red-dark to-brand-navy",
  },
  {
    caption: "Kunjungan ke Perusahaan Penerima",
    place: "Osaka, Jepang",
    icon: "🏭",
    gradient: "from-brand-gold to-brand-navy",
  },
];
