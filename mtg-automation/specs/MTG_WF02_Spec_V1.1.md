# MTG WF02 — Job Verification & QC V1.0

**Peran:** gate terakhir sebelum database operasional. WF01 menemukan kandidat; WF02 membuktikan kandidat layak. WF02 tidak mencari job baru. Tidak ada koneksi WF01 → publishing/poster.

## Alur
Schedule 09:00 & 21:00 JST (1 jam setelah WF01) → Config → Query Queue (Notion) → Flatten → Fetch Source → Re-check Source → Dup Query → Duplicate Check → Build Registry Request → Registry Lookup (gBizINFO) → Company Score → [AI Verify jika belum ada hard-reject] → Final QC → Notion PATCH → Read-back → Verify (CJK) → (APPROVED) upsert Company DB → Shape QC/Error/Run log.

**Queue:** Master Job DB, Ingestion Source = N8N, dan (Status = EXTRACTED) atau (Status = VERIFICATION_REQUIRED + Recheck Required ✔ → re-queue manual). Maks `max_per_run` (30) per run, tertua dulu.

## 10 cek (deterministik; AI hanya memberi opini kedua)
| Cek | PASS | REJECT | REVIEW |
|---|---|---|---|
| source | HelloWork, halaman terbaca, nomor job cocok | halaman tutup/404 | tidak terjangkau / nomor tak cocok |
| freshness | expiry ≥ 3 hari, umur ≤ 180 hari | expiry lewat | tanpa expiry / segera habis / basi |
| company | score ≥ 90 & tanpa konflik (atau Employer Verified manual) | registry: perusahaan tutup | < 90, konflik, registry down |
| corporate_number | dikonfirmasi registry | tutup | belum terkonfirmasi |
| employer_identity | bukan 派遣/請負, AI: direct (kutipan terverifikasi), registry OK | field 派遣/請負, atau AI "bukan direct" + kutipan terbukti | AI down / tidak yakin |
| ssw_eligibility | kutipan SSW lama masih ada di sumber + AI konfirmasi eksplisit | tak ada 特定技能 di sumber / peran manajemen | kutipan hilang / AI tak konfirmasi |
| overseas | frasa eksplisit "海外在住可/来日前面接…" tanpa frasa domestik | frasa domestik-only | **default: UNVERIFIED** |
| salary | cocok dgn data tersimpan, ≥ lantai (bulanan 150.000, jam 1.000) | di bawah lantai | konflik / tak ada / AI: tergantung lembur |
| duplicate | Unique | Job Number sama (lebih lama) | Possible Duplicate / query gagal |
| quality | Quality Score WF01 ≥ 80 | – | kurang |

**Keputusan:** ada REJECT → REJECT; ada REVIEW → REVIEW; semua PASS → APPROVED.

**Company Score (0–100, fakta saja):** 法人番号 terkonfirmasi registry 35 · nama cocok 25 (exact) / 12 (partial) · alamat 20 (kota) / 8 (prefektur) · aktif 10 · bukan dispatch 10. Pencarian by 法人番号 jika ada, jika tidak by nama (kandidat harus nama exact + kota cocok, unik).

## Output ke Notion (Master Job DB)
| Keputusan | Status | Audit Status | Flags |
|---|---|---|---|
| APPROVED | VERIFIED | Audited | Employer/Job/Source Verified ✔ |
| REVIEW | VERIFICATION_REQUIRED | Needs Review (Conflict jika ada konflik) | Employer ✔ bila company lolos; alasan di Recheck Reason |
| REJECT | CLOSED | Unverified (Conflict jika ada konflik) | alasan "REJECT: …" |
Selalu: Recheck Required = ☐, Data Confidence = company score, Last Audit Date, Duplicate Check, Data Conflicts, Audit Notes (hasil tiap cek + 法人番号). Setiap tulis dibaca ulang dan dibandingkan (deteksi korupsi CJK); gagal → dicatat di error log.
APPROVED + company verified → buat/update halaman Company DB (Notes memuat 法人番号; tidak ada properti baru).

**Re-queue manual:** centang Recheck Required pada item REVIEW (opsional centang Employer Verified jika sudah Anda cek) → ikut run berikutnya. Untuk menyetujui manual: ubah Status ke VERIFIED di Notion.

## Setup
1. Import JSON. Credential: Notion MTG Integration, Anthropic API Key (x-api-key) (sama dengan WF01), **gBizINFO API Token** (Header Auth: name `X-hojinInfo-api-token`, value token).
2. Data table sudah dibuat: `mtg_job_qc_log`, `mtg_job_qc_run_log`; error log memakai `mtg_job_scout_error_log` (source=wf02).
3. Config: `require_overseas_verified` (true), `min_monthly/min_hourly`, `gbiz_base`.

## Risiko & hal yang belum terbukti
- Belum dijalankan live. Kode ditest lokal dengan halaman HelloWork nyata + data simulasi. Struktur node meniru WF01 tapi JSON WF02 dirakit langsung (tidak lewat validator SDK).
- gBizINFO: endpoint/header/field dari dokumentasi pihak ketiga (`/hojin/v1/hojin?name=`, `/hojin/v1/hojin/{no}`, `hojin-infos[]`). Perlu token & satu tes nyata; tanpa token → semua company = REVIEW (aman, tidak ada false-approve).
- Overseas: HelloWork jarang menulis bukti eksplisit → hampir semua job berakhir REVIEW di awal. Itu disengaja.
- Lantai gaji (150.000 / 1.000) adalah angka kasar; sesuaikan dengan upah minimum per prefektur.
- REJECT dipetakan ke Status CLOSED (tidak ada status REJECTED di Notion) — mohon konfirmasi.
- Merge dengan banyak input yang sebagian cabang kosong (pola sama dengan WF01) perlu dipastikan pada run pertama.
- Perbaikan WF01: deteksi dispatch sekarang sadar negasi ("派遣・請負ではない" tidak lagi dianggap dispatch). WF01 JSON diperbarui.

## V1.1 (keputusan terkunci 2026-10-05)
- Notion: field baru di Master Job DB — QC Decision, QC Reject Reason, QC Date, MTG QC Status, Recruitability. CLOSED = status operasional MTG, bukan berarti perusahaan menutup lowongan; alasan penolakan tersimpan di QC Reject Reason.
- Gaji di bawah lantai sementara → REVIEW (bukan REJECT). Tabel Minimum Wage Reference (prefektur + tanggal + jenis upah) dibuat terpisah nanti.
- Recruitability: Overseas Confirmed (frasa eksplisit) / Overseas Unverified (default) / Japan Resident (frasa domestik-only; keputusan tetap REJECT/CLOSED).
- Registry gagal / token tidak ada → REVIEW, tidak pernah APPROVED.
