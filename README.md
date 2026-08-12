# Mandiri Tokutei Ginou

Autonomous MTG platform — landing + portal + admin.

Website untuk **Mandiri Tokutei Ginou**, membantu talenta Indonesia menuju
karier Tokutei Ginou (Specified Skilled Worker / 特定技能) di Jepang: mulai
dari penjelasan program, layanan pelatihan & penempatan, lowongan aktif,
materi belajar bahasa Jepang, hingga portal pendaftaran kandidat dan panel
admin dengan alur pencocokan kandidat-lowongan.

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript, Turbopack)
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase](https://supabase.com) (Postgres + Auth + Storage)

## Struktur

- `/` — Landing page publik (profil program, layanan, lowongan aktif dari
  `job_orders`, galeri, testimoni, artikel, materi belajar, FAQ, dan
  formulir konsultasi gratis yang langsung tersimpan sebagai lead)
- `/program` — Perbandingan SSW-1 vs SSW-2, alur proses 8 tahap, transparansi
  biaya, dan hak & perlindungan hukum pekerja
- `/lowongan` — Semua lowongan aktif dengan pencarian & filter sektor
- `/artikel`, `/artikel/[slug]` — Artikel & panduan (7 artikel: perbandingan
  visa, tips ujian, dokumen wajib, kehidupan di Jepang, adaptasi bulan
  pertama kerja, menabung & kirim uang, cerita sukses alumni)
- `/materi-belajar`, `/materi-belajar/[slug]` — 34 modul bahasa Jepang
  tersusun bertahap dari nol (N5) sampai mahir (N1): huruf, tata bahasa,
  kanji per level, kosakata kerja per sektor, frasa wawancara, keigo, dan
  budaya kerja. Kosakata dan contoh kalimat ditampilkan dengan **furigana**
  (bacaan di atas kanji). Halaman daftar bisa difilter per level JLPT.
- `/kebijakan-privasi`, `/syarat-ketentuan` — Kebijakan privasi & syarat
  ketentuan
- `/portal/register`, `/portal/login`, `/portal/dashboard` — Portal kandidat
  (autentikasi Supabase, profil CPMI lengkap, status pendaftaran, checklist
  unggah dokumen, lowongan yang direkomendasikan tim)
- `/admin/login`, `/admin/dashboard` — Panel admin: cari & kelola profil
  kandidat, ubah status (audit-logged otomatis), tautkan kandidat ke
  lowongan spesifik (matching), lihat dokumen lewat signed URL, CRUD
  lowongan, sinkronisasi lowongan dari Notion

## Backend (Supabase)

Portal dan admin terhubung ke basis data Supabase nyata (bukan mock). Semua
tabel di skema ini aktif dipakai aplikasi:

- `cpmi_registrations` — profil pendaftaran kandidat lengkap (nama, kontak,
  NIK, tanggal lahir, alamat domisili, pendidikan terakhir, pengalaman
  kerja, sektor minat, status), terhubung ke `auth.users` lewat
  `auth_user_id`. Nomor registrasi (`MTG-YYYY-NNNNNN`) dibuat otomatis.
  Baris tanpa `auth_user_id` (`auth_user_id IS NULL`) adalah **lead** dari
  formulir konsultasi gratis di beranda — ditandai badge "Lead" di admin.
- `documents` — dokumen yang diunggah kandidat (`jenis_dokumen`: `ktp`, `kk`,
  `ijazah`, `skck`, `foto`, `lainnya`), file tersimpan di bucket Storage privat
  `cpmi-documents` dengan path `<cpmi_id>/<nama-file>`. Admin bisa membuka
  dokumen lewat signed URL langsung dari panel admin.
- `job_orders` — lowongan kerja (`sumber`: `manual` atau `notion_sync`).
  Admin bisa tambah/ubah/nonaktifkan/hapus langsung dari panel admin.
- `job_order_matches` — tautan kandidat ↔ lowongan spesifik yang dikurasi
  admin (`status_match`: `disarankan`, `dipilih_cpmi`, `diterima`,
  `ditolak`). Kandidat melihat lowongan yang ditautkan ke mereka di bagian
  "Direkomendasikan oleh Tim Kami" pada dashboard portal.
- `admin_users` — allowlist admin. **Baris di sini dikelola manual** (lewat
  SQL/dashboard Supabase), bukan lewat pendaftaran mandiri di aplikasi.
- `status_log` — audit trail otomatis (lewat trigger database) setiap kali
  status kandidat berubah — tidak ditulis langsung oleh aplikasi.

Semua tabel memakai Row Level Security: kandidat hanya bisa membaca/mengubah
data miliknya sendiri (`auth_user_id = auth.uid()`), admin (baris di
`admin_users`) bisa mengakses semua data lewat fungsi `is_admin()`. Formulir
konsultasi gratis di beranda memakai kebijakan INSERT khusus yang mengizinkan
kandidat anonim membuat lead (`auth_user_id IS NULL`) tanpa bisa membaca data
lead lain — dilengkapi honeypot field dan pengecekan waktu pengisian minimum
untuk menyaring bot sederhana.

### Environment variables

Salin `.env.example` ke `.env.local` dan isi dengan kredensial project
Supabase Anda:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

### Menambahkan admin baru

Karena `admin_users` tidak bisa ditulis dari aplikasi (by design), tambahkan
admin baru lewat SQL Editor Supabase setelah akun tersebut mendaftar/login
minimal sekali lewat Supabase Auth:

```sql
insert into public.admin_users (id, nama)
values ('<auth-user-uuid>', 'Nama Admin');
```

### Sinkronisasi lowongan dari Notion

Panel admin punya tombol "Sync dari Notion" yang menarik data dari database
Notion **💼 Job Posting** (di CRM Hub Mandiri Tokutei Ginou) dan
mengupsert-nya ke `job_orders` (dicocokkan lewat `notion_page_id`, jadi aman
dijalankan berulang). Untuk mengaktifkannya, buat Notion internal
integration di notion.so/my-integrations, beri akses ke database tersebut,
lalu set di Vercel:

```bash
NOTION_API_KEY=ntn_xxx...
NOTION_JOB_POSTING_DATABASE_ID=<id database Job Posting>
```

Tanpa kedua variabel ini, tombol sync akan menampilkan pesan bahwa fitur
belum dikonfigurasi — fitur lain tetap berjalan normal.

## Pengembangan

```bash
npm install
npm run dev      # jalankan di http://localhost:3000
npm run build    # build production
npm run lint     # jalankan ESLint
```
