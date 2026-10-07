# MTG WF03 — Canonicalization, Lifecycle & Intelligence Layer V1.0

**Prinsip:** satu database saja (🇯🇵 MTG — Master Job Database). WF03 tidak membuat database kedua; ia mengorganisir record yang sama.
WF01 = Find · WF02 = Prove · WF03 = Organize + Intelligence.

## Empat dimensi independen (tidak saling menimpa)
| Dimensi | Field | Ditulis oleh |
|---|---|---|
| QC | QC Decision, MTG QC Status, QC Reject Reason, QC Date | WF02 |
| Recruitability | Recruitability (Overseas Confirmed / Unverified / Japan Resident) | WF02 (dari bukti teks, bukan dari QC) |
| Lifecycle | Lifecycle Status, Lifecycle Reason, Lifecycle Checked, Expiry Date | WF03 |
| Priority | Priority Tier, Tier Reason | WF03 (baca QC + Recruitability + skor; tidak menulisnya) |
`Status` (NEW…CLOSED) adalah status pipeline lama yang dipakai antrean WF01/WF02; WF03 hanya menyentuhnya saat re-queue ke WF02. APPROVED = Overseas Confirmed hanya karena config WF02 `require_overseas_verified=true`; ubah config itu dan Recruitability tetap benar.

## Alur
Schedule 10:00 & 22:00 JST → Config → dua query Notion (A: belum punya Lifecycle / diedit ≤14 jam; B: ACTIVE yang belum dicek hari ini) → gabung & dedupe → [sudah QC? → re-fetch sumber HelloWork] → query dedup final → **Organize** → hanya tulis properti yang berubah → read-back/CJK check → log.

## Yang dikerjakan Organize
1. **Canonical record:** MTG Job ID = field `Job ID` (auto-id Notion, sudah ada). Canonical Key `HW:<求人番号>`, Canonical URL (tanpa query/hash), Canonical Company (nama registry bila terverifikasi, selain itu nama posting NFKC), Corporate Number (dari Audit Notes WF02), Canonical Location, Canonical Monthly Salary, sektor = field `Field`.
2. **Final dedup** (satu query Notion): Job Number, Canonical Key, Canonical URL/Source URL, atau Company+Title+City sama. Master = QC terbaik (APPROVED > REVIEW > REJECT), lalu tertua. Yang bukan master → Lifecycle ARCHIVED, Duplicate Check = Duplicate, `Canonical Of` = URL master.
3. **Lifecycle** (urutan aturan): duplikat → ARCHIVED · belum QC → DISCOVERED/EXTRACTED · sumber hilang → CLOSED · expiry lewat → EXPIRED · QC REJECT → ARCHIVED · QC REVIEW → QC_REVIEW · QC APPROVED + sumber terbuka → ACTIVE · APPROVED tapi sumber tak terjangkau → status lama dipertahankan (atau QC_APPROVED).
   Gaji/libur di sumber berubah setelah ACTIVE → UPDATED + otomatis dikembalikan ke antrean WF02 (Status VERIFICATION_REQUIRED + Recheck Required). Hanya sekali (ACTIVE→UPDATED).
4. **Priority Tier** (hanya QC APPROVED + ACTIVE; threshold di Config): S = Overseas Confirmed + ≥¥300k + Job Score ≥90 + Company Score ≥90 · A = ≥¥270k, ≥85 · B = ≥¥240k, ≥80 · C = sisanya (termasuk non-Overseas Confirmed). Tier Reason menjelaskan angkanya.
5. **Matching-ready** (parse deterministik dari teks tersimpan; tidak disebut = Unknown, tidak pernah ditebak "No"): Dormitory Available, JLPT Required (N1–N5/None/Unknown), License Required, Experience Required, Overtime Hours Avg, Matching Ready (ACTIVE + QC Approved + prefektur + sektor + gaji). Field yang sudah ada tetap dipakai: Recruitability, Field, Prefecture, Monthly Salary, Effective Hourly Wage, Japanese Level, Experience, Certificates, Age, Gender, Housing/Housing Cost, Overtime, Requirements.

## Query target (contoh)
Filter Notion: Lifecycle Status = ACTIVE · Priority Tier = S-TIER · Recruitability = Overseas Confirmed · Canonical Monthly Salary ≥ 300000 · Data Confidence ≥ 90 → kandidat prioritas.

## Setup
Credential Notion + Anthropic tidak dipakai di WF03 (tanpa AI); hanya Notion. Data table baru: `mtg_job_lifecycle_log`, `mtg_job_organize_run_log` (error log pakai tabel yang sama, source=wf03).

## Asumsi & risiko
- Belum dijalankan live; JSON dirakit langsung (tanpa validator SDK), logika dites lokal.
- Mapping QC REJECT → Lifecycle ARCHIVED (daftar lifecycle Anda tidak punya "rejected"); sumber hilang/expired tetap CLOSED/EXPIRED lebih dulu.
- Batas tier (270k/240k, 85/80) usulan saya; hanya S yang Anda tentukan.
- Hanya job N8N-ingested yang diproses; halaman manual lama tidak disentuh.
- Parse matching berbasis regex pada teks Jepang; akurasi perlu dicek pada data nyata.
- Merge dengan cabang kosong perlu dikonfirmasi pada run pertama (pola sama dengan WF01/02).
