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

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  location: string;
  quote: string;
}

// Mirrors the cpmi_registrations_status_check constraint in Supabase.
export type CpmiStatus =
  | "terdaftar"
  | "seleksi_berkas"
  | "tes_wawancara"
  | "pelatihan"
  | "sertifikasi"
  | "matching_job_order"
  | "persiapan_keberangkatan"
  | "bekerja_di_jepang"
  | "tidak_lolos"
  | "mengundurkan_diri";

export const CPMI_STATUS_FLOW: CpmiStatus[] = [
  "terdaftar",
  "seleksi_berkas",
  "tes_wawancara",
  "pelatihan",
  "sertifikasi",
  "matching_job_order",
  "persiapan_keberangkatan",
  "bekerja_di_jepang",
];

export const CPMI_STATUS_LABELS: Record<CpmiStatus, string> = {
  terdaftar: "Terdaftar",
  seleksi_berkas: "Seleksi Berkas",
  tes_wawancara: "Tes & Wawancara",
  pelatihan: "Pelatihan",
  sertifikasi: "Sertifikasi",
  matching_job_order: "Pencocokan Lowongan",
  persiapan_keberangkatan: "Persiapan Keberangkatan",
  bekerja_di_jepang: "Bekerja di Jepang",
  tidak_lolos: "Tidak Lolos",
  mengundurkan_diri: "Mengundurkan Diri",
};

// public.cpmi_registrations
export interface CpmiRegistration {
  id: string;
  nomor_registrasi: string | null;
  nama_lengkap: string;
  nomor_hp: string;
  email: string | null;
  nik: string | null;
  tanggal_lahir: string | null;
  alamat_domisili: string | null;
  pendidikan_terakhir: string | null;
  sektor_minat: string[];
  pengalaman_kerja: string | null;
  status: CpmiStatus;
  auth_user_id: string | null;
  created_at: string;
  updated_at: string;
}

// public.documents
export interface CpmiDocument {
  id: string;
  cpmi_id: string;
  jenis_dokumen: string;
  file_url: string;
  uploaded_at: string;
}

// public.job_orders
export interface JobOrder {
  id: string;
  sumber: "manual" | "notion_sync";
  notion_page_id: string | null;
  nama_perusahaan: string;
  sektor: string;
  lokasi_prefektur: string;
  deskripsi_kerja: string | null;
  syarat: string | null;
  estimasi_gaji: string | null;
  durasi_kontrak: string | null;
  foto_url: string | null;
  status_aktif: boolean;
  created_at: string;
  updated_at: string;
}

// Mirrors the documents_jenis_dokumen_check constraint in Supabase.
export type DocumentType = "ktp" | "kk" | "ijazah" | "skck" | "foto" | "lainnya";

export const REQUIRED_DOCUMENT_TYPES: DocumentType[] = [
  "ktp",
  "kk",
  "ijazah",
  "skck",
  "foto",
];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  ktp: "KTP",
  kk: "Kartu Keluarga",
  ijazah: "Ijazah Terakhir",
  skck: "SKCK",
  foto: "Pas Foto",
  lainnya: "Dokumen Lainnya",
};
