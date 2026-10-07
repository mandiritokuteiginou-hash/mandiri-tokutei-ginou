# mandiri-tokutei-ginou

AI Agent pencari lowongan **特定技能 (Tokutei Ginou)**: mengambil lowongan, menyaring dengan ketat,
lalu menyimpannya ke database **Notion**. Berjalan otomatis **tiap jam 08:00 JST** lewat GitHub Actions.

## Alur
1. **Collect** – Jooble API (Jepang) + RSS opsional (`agent/sources/`).
2. **Filter aturan** (`agent/filters.py`, diatur di `agent/config.yaml`): wajib memuat 特定技能; buang kata terlarang
   (外国人不可, 技能実習のみ, dll.); umur lowongan; sektor (16 bidang); prefektur; gaji bulanan minimum;
   level JLPT maksimum; skor dukungan (ビザサポート, 寮, 日本語不問 …) ≥ `min_score`; dedup.
3. **Verifikasi Claude** (opsional, `ANTHROPIC_API_KEY`) – menolak lowongan ambigu/spam. Bila ragu → tolak.
4. **Notion** – hanya lowongan baru (dedup via properti URL) ditambahkan dengan status "Baru".

## Setup
1. Buat integration di https://www.notion.so/profile/integrations, salin token.
2. Buat sebuah halaman Notion, *Share* ke integration tadi, lalu jalankan:
   ```bash
   pip install -r requirements.txt
   NOTION_TOKEN=secret_xxx python -m agent.main --setup <PARENT_PAGE_ID>
   ```
   Output: `NOTION_DATABASE_ID`.
3. Ambil API key gratis Jooble: https://jooble.org/api/about
4. GitHub → Settings → Secrets → Actions: `NOTION_TOKEN`, `NOTION_DATABASE_ID`, `JOOBLE_API_KEY`, (opsional) `ANTHROPIC_API_KEY`.
5. Selesai. Cron `0 23 * * *` UTC = 08:00 JST. Uji manual: tab Actions → *Tokutei job agent* → Run workflow.

## Lokal
```bash
cp .env.example .env   # isi, lalu: export $(grep -v '^#' .env | xargs)
python -m agent.main --dry-run   # lihat hasil tanpa menulis ke Notion
python -m pytest
```

## Catatan
- GitHub Actions cron bisa tertunda beberapa menit saat server sibuk.
- Mengetatkan/melonggarkan filter: ubah `agent/config.yaml` (`min_score`, `allowed_sectors`, `allowed_prefectures`, `min_monthly_salary_yen`, `max_required_jlpt`, …).
- Menambah sumber: buat modul di `agent/sources/` yang mengembalikan `list[Job]`, panggil di `agent/main.py:collect`.
- Hanya memakai API/RSS resmi; tidak men-scrape situs yang melarangnya.
