# MTG — First Live Test Runbook (WF01 → WF02 → WF03)

Aturan: **jangan aktifkan schedule** sampai semua cek di bawah lulus. Workflow yang di-import berstatus inactive; jalankan manual (Execute workflow) satu per satu.

## 0. Persiapan (sekali)
1. Import WF01 (versi terbaru), WF02 V1.1, WF03 V1.1.
2. Credential: Notion MTG Integration, Anthropic API Key (x-api-key), gBizINFO API Token (Header Auth `X-hojinInfo-api-token`). Pasang di tiap node yang menandainya.
3. Di WF01 Config set `max_ai_jobs` kecil (mis. 3) dan `pages_per_query` = 1 agar run pertama hanya menghasilkan 1–5 record. Di WF02/WF03 set `max_per_run` = 5.
4. Tes gBizINFO: jalankan node "Registry Lookup" sekali; pastikan respons berisi `hojin-infos`. Jika field/endpoint berbeda, perbaiki di `company_match.js` sebelum lanjut.

## 1. WF01 manual → cek Notion
- Halaman baru: Status = EXTRACTED, Ingestion Source = N8N, CJK utuh (社, 株式会社 dll), Source URL benar.
- Tabel `mtg_job_scout_run_log` terisi; `mtg_job_scout_error_log` kosong/wajar.

## 2. WF02 manual → cek Notion
- QC Decision / MTG QC Status / QC Date / Recruitability terisi; Status sesuai (VERIFIED / VERIFICATION_REQUIRED / CLOSED).
- REJECT: QC Reject Reason terisi.
- Audit Notes memuat hasil tiap cek + 法人番号.
- Hampir semua job REVIEW (overseas unverified) = normal.
- Uji path APPROVED: pilih 1 job REVIEW, edit teks sumber TIDAK mungkin, jadi buat 1 record uji manual (Ingestion Source = N8N, Status = EXTRACTED) yang URL-nya halaman HelloWork berisi frasa 海外在住可, atau turunkan sementara `require_overseas_verified` ke false di Config (kembalikan ke true setelah tes).
- Tabel `mtg_job_qc_log` / `mtg_job_qc_run_log` terisi.

## 3. WF03 manual → 8 cek wajib
| # | Cek | Cara | Lulus jika |
|---|---|---|---|
| 1 | QC REJECT → ARCHIVED | ada job REJECT dari langkah 2 | Lifecycle = ARCHIVED; QC Decision/Reject Reason/MTG QC Status TIDAK berubah |
| 2 | Duplikat → satu master | duplikat 1 halaman (Job Number sama, Ingestion Source N8N) | hanya satu yang ACTIVE/QC terbaik; yang lain ARCHIVED + Duplicate Check = Duplicate + Canonical Of terisi |
| 3 | UPDATED → kembali ke WF02 | pada job ACTIVE ubah "Monthly Salary Min" di Notion (±10%) lalu jalankan WF03 | Lifecycle = UPDATED, Status = VERIFICATION_REQUIRED, Recheck Required ✔; jalankan WF02 → diproses ulang |
| 4 | Run kedua tanpa perubahan | jalankan WF03 dua kali berturut-turut | run log run kedua: changed = 0, write_errors = 0 (kecuali Lifecycle Checked yang berganti hari) |
| 5 | S-TIER | job APPROVED+ACTIVE, Overseas Confirmed, ≥300.000, Job ≥90, Company ≥90 | Priority Tier = S-TIER, Tier Reason berisi angka; job non-Overseas Confirmed maks C-TIER |
| 6 | Unknown ≠ No | job tanpa teks SIM/pengalaman/dorm | License/Experience/Dormitory = Unknown, bukan No; Matching Readiness Reason sesuai (MISSING_* / MULTIPLE_UNKNOWN) |
| 7 | Merge cabang kosong | jalankan WF03 saat antrean kosong, lalu saat semua item sudah selesai (semua NO_CHANGE) | tidak error; jumlah record di run log = jumlah halaman yang diproses; tidak ada duplikasi/hilang di `mtg_job_lifecycle_log` |
| 8 | CJK utuh | bandingkan Canonical Company / Lifecycle Reason / Audit Notes dengan sumber | tidak ada karakter rusak; `verify_failed` = 0 |

Periksa juga: pada eksekusi n8n, buka node Merge (Queues, Source Join, All Outcomes, QC Inputs) — jumlah item keluar = jumlah item masuk.

## 4. Baru setelah semua lulus
Aktifkan schedule berurutan: WF01 08:00/20:00 → WF02 09:00/21:00 → WF03 10:00/22:00 JST. Pantau 3 hari: error log, run log, jumlah REVIEW vs APPROVED. Kembalikan nilai Config (max_ai_jobs, pages_per_query, max_per_run).

## 5. Jika ada cek gagal
Hentikan, jangan aktifkan schedule, kirim hasil node (JSON output) + screenshot baris Notion terkait; perbaikan dilakukan per cek.

---
## Addendum — Manual per-record verification (WF02 V1.2)
- Only when the registry is REVIEW or REGISTRY_UNAVAILABLE AND a human ticked **Employer Verified** on that record → verdict MANUAL_VERIFIED. CLOSED is never overridden. No global flag exists.
- All other gates (source, freshness, overseas, salary, SSW, duplicate, quality, employer identity) still run. The 法人番号 gate is satisfied by the manual tick only; Corporate Number stays empty until the registry confirms it.
- New Notion fields written by WF02: Company Verification Method (Registry / Manual / None), Registry Status, Company Verification Date. **Manual Verification Note** is human-only; WF02 never writes it.
- Phase A (no token): checks 1, 2, 4, 7, 8. Phase B (token): re-run the manually verified records with Recheck Required, confirm Method flips to Registry, then checks 3, 5, 6.
