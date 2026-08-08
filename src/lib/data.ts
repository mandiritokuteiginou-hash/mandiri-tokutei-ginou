import { JobListing, Service, Testimonial, Sector } from "./types";

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

export const JOBS: JobListing[] = [
  {
    id: "kaigo-osaka-01",
    title: "Perawat Lansia (Kaigo)",
    sector: "Perawat (Kaigo)",
    location: "Osaka, Jepang",
    salaryRange: "¥180.000 - ¥210.000 / bulan",
    slots: 8,
    postedAt: "2026-07-20",
    description:
      "Bekerja di fasilitas perawatan lansia dengan pelatihan on-the-job dan dukungan penuh dari perusahaan penerima.",
    requirements: [
      "Lulus ujian skill Kaigo atau JFT-Basic/N4",
      "Usia 19-35 tahun",
      "Sehat jasmani & rohani",
    ],
  },
  {
    id: "konstruksi-nagoya-02",
    title: "Tukang Konstruksi Bangunan",
    sector: "Konstruksi",
    location: "Nagoya, Jepang",
    salaryRange: "¥190.000 - ¥230.000 / bulan",
    slots: 12,
    postedAt: "2026-07-25",
    description:
      "Proyek konstruksi bangunan komersial, termasuk pekerjaan struktur dan finishing.",
    requirements: [
      "Lulus ujian skill konstruksi",
      "Pengalaman kerja konstruksi diutamakan",
      "Usia 19-35 tahun",
    ],
  },
  {
    id: "manufaktur-osaka-03",
    title: "Operator Produksi Manufaktur",
    sector: "Manufaktur",
    location: "Gifu, Jepang",
    salaryRange: "¥175.000 - ¥200.000 / bulan",
    slots: 15,
    postedAt: "2026-08-01",
    description:
      "Operator mesin produksi komponen otomotif dengan sistem kerja shift.",
    requirements: [
      "Lulus ujian skill manufaktur atau SSW test",
      "Teliti dan disiplin",
      "Usia 19-35 tahun",
    ],
  },
  {
    id: "perikanan-hokkaido-04",
    title: "Awak Kapal Perikanan",
    sector: "Perikanan",
    location: "Hokkaido, Jepang",
    salaryRange: "¥185.000 - ¥215.000 / bulan",
    slots: 6,
    postedAt: "2026-08-03",
    description:
      "Bekerja pada kapal penangkap ikan dengan pelatihan keselamatan kerja laut.",
    requirements: [
      "Sehat & tidak takut laut",
      "Lulus ujian skill perikanan",
      "Usia 19-35 tahun",
    ],
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
