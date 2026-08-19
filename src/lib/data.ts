import { Service, Testimonial, Sector } from "./types";

export const SECTORS: Sector[] = [
  "Perawat (Kaigo)",
  "Konstruksi",
  "Manufaktur",
  "Perikanan",
  "Pertanian",
  "Perhotelan & Food Service",
];

export const SERVICES: Service[] = [
  {
    title: "Pelatihan Bahasa & Keterampilan",
    description:
      "Kelas bahasa Jepang (JLPT/JFT-Basic) dan pelatihan skill sesuai standar Tokutei Ginou, dibimbing instruktur berpengalaman.",
    icon: "training",
  },
  {
    title: "Penempatan Kerja",
    description:
      "Pencocokan kandidat dengan perusahaan penerima (kikan) di Jepang sesuai sektor dan kualifikasi, tanpa biaya tersembunyi.",
    icon: "placement",
  },
  {
    title: "Pengurusan Dokumen & Visa",
    description:
      "Bantuan lengkap pengurusan COE, visa Tokutei Ginou, kontrak kerja, hingga keberangkatan.",
    icon: "document",
  },
  {
    title: "Pendampingan Selama di Jepang",
    description:
      "Dukungan adaptasi, konsultasi masalah kerja, dan pendampingan dari mitra kami di Jepang selama masa kontrak.",
    icon: "support",
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    name: "Budi Santoso",
    role: "Kaigo Worker",
    location: "Fukuoka, Jepang",
    quote:
      "Proses dari pelatihan sampai berangkat sangat terarah. Tim Mandiri Tokutei Ginou selalu sigap membantu urus dokumen.",
  },
  {
    id: "t2",
    name: "Siti Rahma",
    role: "Manufaktur",
    location: "Aichi, Jepang",
    quote:
      "Awalnya nervous soal bahasa Jepang, tapi kelas persiapannya benar-benar membantu saya lulus JFT-Basic.",
  },
  {
    id: "t3",
    name: "Andi Prasetyo",
    role: "Konstruksi",
    location: "Osaka, Jepang",
    quote:
      "Gaji dan kontrak kerja jelas sejak awal, tidak ada biaya tersembunyi. Sekarang sudah jalan 1.5 tahun kerja di Jepang.",
  },
];
