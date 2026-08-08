export type Sector =
  | "Perawat (Kaigo)"
  | "Konstruksi"
  | "Manufaktur"
  | "Perikanan"
  | "Pertanian"
  | "Perhotelan & Food Service";

export interface Service {
  title: string;
  description: string;
  icon: "training" | "placement" | "document" | "support";
}

export interface JobListing {
  id: string;
  title: string;
  sector: Sector;
  location: string;
  salaryRange: string;
  slots: number;
  postedAt: string;
  description: string;
  requirements: string[];
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  location: string;
  quote: string;
}

export type ApplicationStatus =
  | "Berkas Diverifikasi"
  | "Pelatihan Bahasa"
  | "Ujian Skill & JLPT"
  | "Menunggu Penempatan"
  | "Ditempatkan di Jepang";

export interface CandidateProfile {
  fullName: string;
  email: string;
  phone: string;
  sectorInterest: Sector;
  status: ApplicationStatus;
  documents: { name: string; uploaded: boolean }[];
  appliedJobId?: string;
  createdAt: string;
}

export interface AdminUser {
  email: string;
}
