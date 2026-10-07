# MTG N8N Workflow #01 — Daily Tokutei Ginou Job Scout V1.0
Spec lengkap (item 1–9) + setup. File workflow: `MTG_WF01_Daily_Job_Scout_V1.0.json` (40 node, import langsung ke n8n).

> Prinsip: **MTG DATABASE MUST CONTAIN FACTS, NOT AI GUESSES.** AI hanya mengekstrak & memberi skor; lulus/tidaknya ditentukan gate deterministik (kode). Tidak ada AI call untuk job yang gagal pre-filter atau M1–M8.

## 0. Alur
```
Schedule 08:00 & 20:00 JST
 → Config → Build Search Tasks (source registry)
 → Fetch Listing (retry 3x, 1 req/2.5s, error→lanjut)
 → Parse Listing ─ error/meta item ─────────────────────────────┐
 → Cache Dedup (Data Table, rowNotExists)                        │
 → Pre-Filter (agency/koperasi/platform, dedup dalam-run, cap AI)│
 → Fetch Detail → Prepare Extract → [AI #1 Extract]              │
 → Gates M1–M8 (deterministik) ── gagal ─────────────────────────┤
 → [AI #2 Screen+Score] → Parse Score (skor deterministik+AI)    │
 → Quality Gate (Job ≥ 80, tanpa veto AI) ── gagal ──────────────┤
 → Build Notion Payload → Notion Dup Check ── sudah ada ─────────┤
 → Create Job Page (Status=NEW) → Read-back → Verify CJK ── gagal┤
 → Commit Status=EXTRACTED → Mark Written ───────────────────────┤
     └→ Company Gate (≥90 + 法人番号 valid) → Private Company DB  │
 → All Outcomes (merge) ←─────────────────────────────────────────┘
     ├→ Cache rows  → Insert Cache
     ├→ Error rows  → Insert Error Log
     └→ Run Log     → Insert Run Log
```
Sumber aktif V1.0: **hellowork.careers** (parser sudah diuji dengan HTML asli). en-gage, job-medley, Indeed, Mintoku = placeholder **disabled** di `Build Search Tasks` (Indeed/Mintoku sesuai keputusan: tunggu QC legal/akses/rendering). YOLO, WORK JAPAN, 5sjob, nipponshigoto tidak ada di registry (excluded).

## 1. Prompt AI #1 — Extract (node `Prepare Extract` → `AI Extract`, model `ai_model_extract`, temperature 0)
```
あなたは求人票の「事実抽出」専用エンジンです。入力された求人票テキストに書かれている内容だけをJSONに転記します。推測・補完・一般知識による穴埋めは禁止です。
ルール:
1. 求人票に明記されていない項目は文字列 "UNKNOWN"（数値項目は null）にする。
2. 数値は求人票の記載をそのまま使う。年収→月収の換算、残業込みの総額計算は禁止。固定残業代は別項目に分ける。
3. ssw_mention の分類（厳守）:
   - EXPLICIT_RECRUIT: この求人自体が特定技能外国人を採用対象としていると明記（例: 特定技能の方歓迎/募集/受入可/特定技能1号可）
   - MANAGEMENT_ROLE: 特定技能外国人を管理・教育・支援する側の仕事（例: 外国人スタッフの管理、登録支援、海外人材対策課）
   - HR_LABEL: 社員区分や会社紹介の中での単なる言及（例: 特定技能社員、特定技能外国人が在籍中/活躍中）
   - MENTION_ONLY: 特定技能の語はあるが採用対象かどうか不明
   - NONE: 言及なし
4. ssw_evidence_quote は求人票テキストからの一字一句そのままの引用（60字以内）。見つからなければ "UNKNOWN"。要約や言い換えは禁止。
5. company_type: DIRECT_EMPLOYER / STAFFING_AGENCY（派遣・紹介・請負が主業）/ COOPERATIVE（協同組合・監理団体）/ REGISTERED_SUPPORT_ORG / PLATFORM / UNKNOWN。「派遣・請負等」欄が派遣なら STAFFING_AGENCY。
6. overseas_applicant: 国内在住者のみ・在留カード所持必須・海外在住不可と明記なら DOMESTIC_ONLY、海外からの応募可と明記なら OK、記載なしは UNKNOWN。domestic_evidence_quote に原文引用。（ハローワーク紹介状の記載だけでは DOMESTIC_ONLY にしない）
7. sector_jp は次のいずれか1つ: 介護 / 外食 / 食品製造 / 製造 / 建設 / 農業 / 宿泊 / ビルクリーニング / 造船・舶用工業 / 自動車整備 / 航空 / その他。
8. corporate_number は13桁の数字が求人票に明記されている場合のみ。なければ "UNKNOWN"。
9. 出力はJSONオブジェクトのみ。前後の説明文・コードフェンス禁止。
スキーマ:
{"job_title_jp":"","company_name_jp":"","company_type":"","is_dispatch":"true|false|UNKNOWN","ssw_mention":"","ssw_evidence_quote":"","sector_jp":"","role_summary_jp":"","salary":{"type":"MONTHLY|HOURLY|DAILY|ANNUAL|UNKNOWN","min":null,"max":null,"fixed_overtime_amount":null,"allowances_text":"","calc_note":""},"bonus":"","salary_increase":"","overtime_hours_per_month":"","working_hours":"","work_days_per_month":"","holiday_text":"","annual_holidays":null,"break_minutes":"","housing_text":"","japanese_level":"","experience":"","certificates":"","age_limit_text":"","nationality_text":"","visa_text":"","overseas_applicant":"","domestic_evidence_quote":"","prefecture":"","city":"","address":"","benefits_text":"","insurance_text":"","selection_text":"","quota":null,"posted_date_text":"","expiry_date_text":"","corporate_number":""}
```
User message: `求人番号`, nama perusahaan & judul dari halaman daftar, lalu teks detail (dipotong ≤7.500 karakter, mulai dari bagian 募集内容).

## 2. Prompt AI #2 — Screen + Score (node `Prepare Score` → `AI Screen and Score`, model `ai_model_score`, temperature 0)
```
あなたはMTG（外国人材の特定技能就労支援）の求人スクリーニング担当です。渡された「抽出済み事実JSON」と「求人票原文」だけを根拠に、次の項目を採点・判定します。事実の追加・推測は禁止。根拠が原文にない場合は低く採点し、missing_fields に書きます。
採点基準（整数のみ、上限厳守）:
- ssw_clarity (0-20): 特定技能の受入が明確(20)／明記だが条件不明(14)／示唆のみ(7)／不明(0)。分野・職種が特定技能の対象業務と一致するかも考慮。
- detail_completeness (0-15): 仕事内容・就業時間・休日・賃金内訳・勤務地・雇用期間・応募方法の記載の充実度。
- benefits_conditions (0-10): 社会保険完備、賞与、昇給、住宅/寮、交通費、年間休日（105日以上が基準）、残業時間の明示。
- japanese_clarity (0-5): 日本語要件が明記(5)／間接的(3)／不明(0)。
スクリーニング質問への回答（true/false、根拠不足ならfalse）:
q1_is_ssw_job / q2_sector_valid_for_ssw / q3_salary_matches_source / q5_posting_active / q6_employer_identifiable / q7_source_reliable / q8_critical_data_missing
q4_salary_basis は FIXED / RANGE / ESTIMATED / OVERTIME_DEPENDENT / COMMISSION_DEPENDENT / UNKNOWN のいずれか。
出力はJSONオブジェクトのみ（コードフェンス・説明禁止）:
{"ssw_clarity":0,"detail_completeness":0,"benefits_conditions":0,"japanese_clarity":0,"q1_is_ssw_job":false,"q2_sector_valid_for_ssw":false,"q3_salary_matches_source":false,"q4_salary_basis":"UNKNOWN","q5_posting_active":false,"q6_employer_identifiable":false,"q7_source_reliable":false,"q8_critical_data_missing":false,"missing_fields":[],"concerns":[],"rationale_jp":""}
```
Input: JSON hasil ekstrak + teks asli (≤5.000 karakter). Hanya dipanggil untuk job yang lulus M1–M8.

## 3. Gate M1–M8 (node `Gates M1-M8`, kode deterministik)
Semua gate dievaluasi (bukan berhenti di yang pertama) supaya alasan penolakan lengkap tercatat.

| Gate | Lulus jika | Gagal (hard reject) |
|---|---|---|
| M1 employer langsung | `company_type` bukan STAFFING_AGENCY/COOPERATIVE/REGISTERED_SUPPORT_ORG/PLATFORM **dan** kolom 派遣・請負等 di HelloWork bukan 派遣/請負 **dan** nama perusahaan tidak cocok regex 協同組合/事業協同/登録支援機関/人材派遣/人材紹介/職業紹介/派遣 | salah satu terpenuhi. `UNKNOWN` type = lulus + flag `employer_type_unverified` |
| M2 ini memang job SSW | `ssw_mention=EXPLICIT_RECRUIT` **dan** kutipan bukti **ada verbatim di teks sumber** (cek substring) **dan** mengandung 特定技能 + kata rekrut (募集/歓迎/可/対象/受入/採用/応募/在留資格/優遇…) **dan** bukan hanya 在籍/活躍/社員 **dan** bukan peran manajemen (外国人/海外人材/特定技能 + 管理/教育/支援/対策/サポート/通訳/担当 di judul/ringkasan) | HR_LABEL, MENTION_ONLY, MANAGEMENT_ROLE (hard reject), kutipan tidak ditemukan di teks |
| M3 aktif & bertanggal | 有効期限 terbaca dan ≥ hari ini (JST) | kadaluarsa / tanpa tanggal. Umur 受理日 > 180 hari → flag `stale_over_180d` → penalti −20 di skor |
| M4 gaji bulanan | 賃金 bulanan 100.000–1.000.000 yen. Jika 賃金形態 = 時給: hanya lolos untuk sektor di `allow_hourly_sectors` (default 農業,漁業) + flag `hourly_basis…` | tidak ada / tidak masuk akal / hourly di sektor lain |
| M5 kondisi kerja | jam kerja **dan** (年間休日 atau teks hari libur) ada. Flag jika <105 hari | salah satu kosong |
| M6 identitas & lokasi *(definisi MTG — mohon konfirmasi)* | prefektur + (kota atau alamat) + nama perusahaan + judul job ada | ada yang kosong |
| M7 bisa untuk pelamar luar negeri | tidak ada pernyataan eksplisit "国内在住のみ / 在留カード必須 / 海外在住不可" (kutipan harus ada di teks) | ada pernyataan eksplisit. Diam = lulus + flag `overseas_applicability_unverified`. 紹介状 HelloWork **tidak** dianggap domestic-only |
| M8 sumber tertelusur | URL https, 求人番号 `NNNNN-NNNNNNNN`, teks detail >800 karakter | salah satu gagal |

## 4. Skor 0–100 (node `Parse Score`)
| Komponen | Maks | Sumber | Aturan |
|---|---|---|---|
| Salary | 25 | **kode** | gaji pokok bulanan (−固定残業代): ≥300k=25, ≥280k=21, ≥260k=17, ≥240k=12, ≥220k=7, >0=3. −3 jika hourly, −5 jika overtime/commission-dependent |
| Company verification | 15 | **kode** | 法人番号 13 digit **dengan check-digit valid** =15; direct employer tanpa 法人番号 =8; lainnya =3 |
| Source reliability | 10 | **kode** | hellowork =10, lainnya =5 |
| SSW/visa clarity | 20 | AI (di-clamp) | rubrik di prompt |
| Job detail completeness | 15 | AI (di-clamp) | |
| Benefits/conditions | 10 | AI (di-clamp) | |
| Japanese clarity | 5 | AI (di-clamp) | |
| Penalti | −20 | **kode** | job > 180 hari |

Kelas: ≥90 HIGH_PRIORITY, 80–89 GOOD_CANDIDATE, 70–79 NEEDS_REVIEW, <70 REJECT_ARCHIVE. **Quality gate**: skor ≥ `job_threshold` (80) **dan** tidak ada veto AI (Q1 bukan job SSW / Q2 sektor tidak valid / Q3 gaji tidak cocok sumber / Q5 tidak aktif).
Company score (deterministik, 0–100): 法人番号 valid 35 + direct employer terverifikasi 20 + SSW eksplisit 20 + alamat lengkap 10 + sumber HelloWork 10 + job lolos 5. Masuk Private Company DB hanya jika ≥ `company_threshold` (90) → praktis hanya perusahaan dengan 法人番号 valid di teks sumber.

## 5. Mapping Notion — Master Job DB (`collection://a5cfe2a2-…`)
Ditulis lewat Notion API (HTTP, `Notion-Version 2025-09-03`, parent `data_source_id`). Field kosong/UNKNOWN **tidak ditulis**; daftar field kosong masuk `Missing Data`.

| Property Notion | Isi |
|---|---|
| Job Title (title) | `job_title_jp` ekstrak (fallback judul daftar) |
| Job Number | 求人番号 |
| Company | nama perusahaan final |
| Field (select) | sektor (dipetakan ke opsi yang ada; selain itu `その他`) |
| Position | ringkasan peran |
| Prefecture / City / Address | ekstrak |
| Salary | 賃金形態 + angka bulanan situs + tunjangan + 固定残業代 (teks, tidak dihitung ulang) |
| Monthly Salary Min/Max | dari 賃金 HelloWork |
| Effective Hourly Wage | hanya jika 時給 |
| Bonus, Overtime, Salary Increase, Working Hours, Work Days, Holidays, Annual Holidays, Break, Housing, Benefits, Japanese Level, Experience, Certificates, Age, Nationality, Selection Process | ekstrak apa adanya |
| Visa Status | `特定技能 根拠引用: 「…」` + visa_text |
| Quota | angka jika ada |
| Application Route | `Hello Work` |
| Source URL | URL detail |
| Source Type / Source Confidence | `Website` / `High` |
| Status | `NEW` saat dibuat → `EXTRACTED` hanya setelah read-back OK |
| Duplicate Check | `Unique` |
| Quality Score | skor total |
| Data Completeness | % dari 17 field kunci yang terisi |
| Missing Data | daftar field kosong |
| Audit Status | `Unverified` |
| Audit Notes | jejak gate + rincian skor + flags + 法人番号 + alasan AI |
| Recheck Required / Reason | ✔ / "Workflow #02 verification pending" |
| Ingestion Source / Agent | `N8N` / `N8N` |
| Automation Workflow, Run ID, Discovery Batch ID, Scout Run Date, Scout Run Time | metadata run |
| *Tidak disentuh* | Employer/Job/Source Verified, Data Confidence, Content/Image/Publish fields, caption |

Private Company DB (`collection://a72e12ca-…`): Company Name (title), Company Name JP, Industry, Prefecture, City, Source, Source URL, First Found, Last Checked, SSW Acceptance (+kutipan), Notes (**法人番号** + score + run — DB belum punya property khusus; saran: tambah property "Corporate Number"), Partnership Status=Prospect, Contact Status=Not Contacted.

## 6. Data Table (sudah dibuat di n8n kamu)
- `mtg_job_scout_cache` — job_key, source, status, reason, company, title, job_score, run_id, notion_page_id, first_seen
- `mtg_job_scout_error_log` — run_id, ts, source, stage, error_type, error_message, retry_status, job_key
- `mtg_job_scout_run_log` — run_id, started_at, finished_at, sources_enabled/disabled, tasks, fetch_errors, listings_found, duplicates_skipped_by_cache, new_after_dedup, prefilter_rejected, deferred, ai_errors, detail_fetch_errors, gate_rejected, ai_screen_rejected, below_threshold, notion_duplicates, notion_errors, verify_failed, written_verified, high_priority, final_candidates_json

## 7. Dedup
1. Kunci: `HW-<求人番号>` (format PPPPP-NNNNNNNN). Perusahaan sama + fasilitas/nomor beda **bukan** duplikat.
2. Lapis 1 — dalam-run: job yang sama muncul di beberapa query sektor → diambil sekali (Pre-Filter).
3. Lapis 2 — cache: `Cache Dedup` (rowNotExists). Semua hasil final (reject/lolos/duplikat) di-cache supaya tidak diproses & tidak dibayar AI lagi.
4. Lapis 3 — Notion = source of truth: query `Job Number` sebelum create; jika ada → `NOTION_DUPLICATE`.
5. Status yang **tidak** di-cache (akan dicoba lagi run berikutnya): DEFERRED, AI_ERROR, FETCH_DETAIL_ERROR, NOTION_ERROR.
6. Perusahaan: key `CO-<法人番号>` di tabel cache yang sama.

## 8. Run Log & Error Log
Satu baris `run_log` per run (angka tiap tahap + daftar kandidat final). Satu baris `error_log` per kegagalan: source, timestamp, error type, message, retry status (fetch listing, fetch detail, AI error, Notion error, verify gagal).

## 9. Read-back / CJK check
Create page dengan `Status=NEW` → GET page → bandingkan **setiap** nilai yang dikirim (title, rich_text, number, select, url, checkbox) dengan nilai yang dibaca ulang. Satu karakter beda (mis. 社→也, kana ganda) = `VERIFY_FAILED`: tidak dihitung sukses, halaman tetap `NEW` (tidak dikonsumsi workflow lain), masuk Error Log dengan page id. Hanya jika semua cocok → PATCH `Status=EXTRACTED`. Teks tidak mengandung domain telanjang (hindari auto-link Notion).

## 10. Error & retry
| Titik | Perilaku |
|---|---|
| Fetch listing/detail | retry 3x (jeda 4 dtk), 1 request/2–2,5 dtk; gagal → item error → Error Log → source/job lain lanjut |
| AI extract/score | retry 3x (jeda 5 dtk); gagal/JSON rusak → `AI_ERROR`, tidak di-cache, diulang run berikutnya |
| Notion | retry 3x, 400 ms antar request; gagal → `NOTION_ERROR` |
| Satu job gagal | tidak menghentikan run |
| Biaya | cap `max_ai_jobs` (40) per run; sisanya `DEFERRED` |

## 11. Setup (±10 menit)
1. n8n → Import from file → `MTG_WF01_Daily_Job_Scout_V1.0.json`. Settings → Timezone **Asia/Tokyo** (sudah ada di file).
2. Credential **Notion API** ("Notion MTG Integration"): buat Internal Integration, share ke Master Job DB dan Private Company DB.
3. Credential **Custom Auth (templated)** ("Anthropic API Key (x-api-key)"): template `{"headers":{"x-api-key":"{{api_key}}"}}`, isi API key Anthropic. (Atau ganti ke Header Auth `x-api-key` di 2 node AI.)
4. Data Table sudah ada. Jalankan manual sekali (Execute workflow) dengan `pages_per_query=1`, cek Notion, lalu Publish.
5. Semua parameter (threshold, model, cap) ada di node **Config**.

## 12. Keputusan terbuka / risiko
- **M6** tidak didefinisikan di brief → saya pakai definisi "identitas & lokasi lengkap". Ganti kalau M6 aslimu lain.
- **時給 di 農業/漁業** saat ini diterima (`allow_hourly_sectors`). Ubah di Config.
- **法人番号**: dicek checksum-nya, belum dicocokkan ke gBizINFO (butuh token/endpoint). Konsekuensi: Company DB hanya terisi jika teks sumber memuat 法人番号. Verifikasi registry = Workflow #02.
- **M7 vs HelloWork**: lowongan HelloWork pada dasarnya lewat 紹介状; saya tidak menganggapnya domestic-only, tapi semua job diberi flag `overseas_applicability_unverified` → cek di #02.
- **Belum dijalankan end-to-end di n8n** (butuh credential Notion & Anthropic darimu). Yang sudah dites lokal dengan data asli/sintetis: parser HelloWork (20 baris), pre-filter, ekstraksi fakta detail, gate M1–M8, skor, payload Notion, verifikasi read-back (termasuk deteksi 社→也), check-digit 法人番号, run log. Struktur workflow lolos validasi SDK n8n (40 node).
- Cache saat ini permanen (job yang ditolak tidak dinilai ulang). TTL/re-evaluasi bisa ditambah di V1.1.
