# Mandiri Tokutei Ginou

Autonomous MTG platform — landing + portal + admin.

Website untuk **Mandiri Tokutei Ginou**, membantu talenta Indonesia menuju
karier Tokutei Ginou (Specified Skilled Worker / 特定技能) di Jepang: mulai
dari penjelasan program, layanan pelatihan & penempatan, lowongan aktif,
hingga portal pendaftaran kandidat dan panel admin.

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- [Tailwind CSS](https://tailwindcss.com)

## Struktur

- `/` — Landing page publik (profil program, layanan, lowongan, testimoni, kontak)
- `/portal/register`, `/portal/login`, `/portal/dashboard` — Portal kandidat
- `/admin/login`, `/admin/dashboard` — Panel admin (kelola status kandidat)

Portal dan admin saat ini menggunakan **mock auth berbasis `localStorage`**
di browser (belum terhubung ke basis data server) sebagai kerangka awal.
Kredensial demo admin: `admin@mandiritokuteiginou.id` / `admin123`
(lihat `src/lib/admin.ts`).

## Pengembangan

```bash
npm install
npm run dev      # jalankan di http://localhost:3000
npm run build    # build production
npm run lint     # jalankan ESLint
```

## Langkah selanjutnya

- Ganti mock auth (`src/lib/storage.ts`, `src/lib/admin.ts`) dengan autentikasi
  nyata (mis. NextAuth) dan basis data (mis. PostgreSQL/Supabase).
- Hubungkan data lowongan (`src/lib/data.ts`) ke sumber data dinamis yang bisa
  dikelola dari panel admin.
- Tambahkan upload dokumen sungguhan untuk checklist di portal kandidat.
