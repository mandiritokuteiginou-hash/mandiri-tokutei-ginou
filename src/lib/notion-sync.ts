// Maps job postings from the "💼 Job Posting" Notion database (in the
// Mandiri Tokutei Ginou CRM Hub) into public.job_orders rows. The Notion
// schema's field names/options are documented here since they live outside
// this repo.

const SECTOR_MAP: Record<string, string> = {
  "Perawatan Lansia": "Perawat (Kaigo)",
  Konstruksi: "Konstruksi",
  "Pengolahan Material": "Manufaktur",
  "Mesin Industri": "Manufaktur",
  "Elektronik & IT": "Manufaktur",
  "Pembuatan Kapal": "Manufaktur",
  "Perawatan Otomotif": "Manufaktur",
  Penerbangan: "Manufaktur",
  "Industri Makanan": "Manufaktur",
  "Kebersihan Gedung": "Perhotelan & Food Service",
  Perhotelan: "Perhotelan & Food Service",
  Restoran: "Perhotelan & Food Service",
  Pertanian: "Pertanian",
  Perikanan: "Perikanan",
};

interface NotionSelectProperty {
  select: { name: string } | null;
}

interface NotionTitleProperty {
  title: { plain_text: string }[];
}

interface NotionRichTextProperty {
  rich_text: { plain_text: string }[];
}

interface NotionNumberProperty {
  number: number | null;
}

export interface NotionJobPostingPage {
  id: string;
  properties: {
    Posisi: NotionTitleProperty;
    Sektor: NotionSelectProperty;
    "Lokasi Kerja": NotionRichTextProperty;
    Deskripsi: NotionRichTextProperty;
    "Bahasa Required": NotionSelectProperty;
    "Gaji Min": NotionNumberProperty;
    "Gaji Max": NotionNumberProperty;
    "Status Lowongan": NotionSelectProperty;
  };
}

export interface JobOrderUpsert {
  sumber: "notion_sync";
  notion_page_id: string;
  nama_perusahaan: string;
  sektor: string;
  lokasi_prefektur: string;
  deskripsi_kerja: string;
  syarat: string;
  estimasi_gaji: string;
  status_aktif: boolean;
}

function plainText(prop: { plain_text: string }[] | undefined): string {
  return (prop ?? []).map((t) => t.plain_text).join("");
}

function formatSalary(min: number | null, max: number | null): string {
  const fmt = (n: number) => `¥${n.toLocaleString("id-ID")}`;
  if (min && max && max !== min) return `${fmt(min)} - ${fmt(max)} / bulan`;
  if (min) return `${fmt(min)} / bulan`;
  if (max) return `${fmt(max)} / bulan`;
  return "";
}

export function mapNotionPageToJobOrder(page: NotionJobPostingPage): JobOrderUpsert {
  const posisi = plainText(page.properties.Posisi?.title);
  const sektorRaw = page.properties.Sektor?.select?.name ?? "";
  const bahasa = page.properties["Bahasa Required"]?.select?.name ?? "";
  const status = page.properties["Status Lowongan"]?.select?.name ?? "";

  return {
    sumber: "notion_sync",
    notion_page_id: page.id.replace(/-/g, ""),
    nama_perusahaan: posisi || "Lowongan Tokutei Ginou",
    sektor: SECTOR_MAP[sektorRaw] ?? (sektorRaw || "Manufaktur"),
    lokasi_prefektur: plainText(page.properties["Lokasi Kerja"]?.rich_text) || "Jepang",
    deskripsi_kerja: plainText(page.properties.Deskripsi?.rich_text),
    syarat: bahasa && bahasa !== "Tidak wajib" ? `Bahasa Jepang minimal ${bahasa}` : "",
    estimasi_gaji: formatSalary(
      page.properties["Gaji Min"]?.number ?? null,
      page.properties["Gaji Max"]?.number ?? null
    ),
    status_aktif: status === "Open",
  };
}
