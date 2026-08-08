# Mandiri Tokutei Ginou

Autonomous MTG platform — landing + portal + admin.

Website untuk **Mandiri Tokutei Ginou**, membantu talenta Indonesia menuju
karier Tokutei Ginou (Specified Skilled Worker / 特定技能) di Jepang: mulai
dari penjelasan program, layanan pelatihan & penempatan, lowongan aktif,
hingga portal pendaftaran kandidat dan panel admin.

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase](https://supabase.com) (Postgres + Auth + Storage)

## Struktur

- `/` — Landing page publik (profil program, layanan, lowongan aktif dari
  `job_orders`, testimoni, FAQ, artikel, kontak)
- `/artikel`, `/artikel/[slug]` — Artikel & panduan
- `/portal/register`, `/portal/login`, `/portal/dashboard` — Portal kandidat
  (autentikasi Supabase, status pendaftaran, unggah dokumen)
- `/admin/login`, `/admin/dashboard` — Panel admin (kelola status kandidat)

## Backend (Supabase)

Portal dan admin terhubung ke basis data Supabase nyata (bukan mock):

- `cpmi_registrations` — data pendaftaran kandidat, terhubung ke `auth.users`
  lewat `auth_user_id`. Nomor registrasi (`MTG-YYYY-NNNNNN`) dibuat otomatis.
- `documents` — dokumen yang diunggah kandidat (`jenis_dokumen`: `ktp`, `kk`,
  `ijazah`, `skck`, `foto`, `lainnya`), file tersimpan di bucket Storage privat
  `cpmi-documents` dengan path `<cpmi_id>/<nama-file>`.
- `admin_users` — allowlist admin. **Baris di sini dikelola manual** (lewat
  SQL/dashboard Supabase), bukan lewat pendaftaran mandiri di aplikasi.
- `job_orders` — lowongan kerja (sumber `manual` atau `notion_sync`).
- `status_log` — audit trail otomatis setiap kali status kandidat berubah.

Semua tabel memakai Row Level Security: kandidat hanya bisa membaca/mengubah
data miliknya sendiri (`auth_user_id = auth.uid()`), admin (baris di
`admin_users`) bisa mengakses semua data lewat fungsi `is_admin()`.

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

## Pengembangan

```bash
npm install
npm run dev      # jalankan di http://localhost:3000
npm run build    # build production
npm run lint     # jalankan ESLint
```

## Langkah selanjutnya

- CRUD lowongan (`job_orders`) langsung dari panel admin (saat ini hanya
  tampil, dikelola lewat Supabase/Notion sync).
- Sinkronisasi `job_orders` dari Notion (`sumber = 'notion_sync'`, field
  `notion_page_id` sudah disiapkan di skema).
- Preview/download dokumen kandidat di panel admin lewat signed URL Storage.
