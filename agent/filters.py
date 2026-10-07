"""Filter ketat bertahap. Setiap tahap bisa menolak lowongan dan mencatat alasannya."""
from __future__ import annotations

import re
from datetime import datetime, timedelta

from .models import Job

# 16 sektor 特定技能 (kata kunci deteksi)
SECTORS: dict[str, list[str]] = {
    "介護": ["介護", "ケアワーカー", "老人ホーム", "デイサービス"],
    "ビルクリーニング": ["ビルクリーニング", "ビルメンテ", "清掃"],
    "工業製品製造業": ["工場", "製品製造", "機械加工", "金属プレス", "溶接", "塗装", "電気電子", "鋳造"],
    "建設": ["建設", "土木", "型枠", "鉄筋", "とび", "内装仕上", "左官", "配管", "電気工事"],
    "造船・舶用工業": ["造船", "舶用"],
    "自動車整備": ["自動車整備", "整備士"],
    "航空": ["空港グランドハンドリング", "航空機整備", "グランドハンドリング"],
    "宿泊": ["ホテル", "旅館", "宿泊", "フロント"],
    "自動車運送業": ["タクシー", "トラック運転", "バス運転", "ドライバー"],
    "鉄道": ["鉄道", "軌道整備"],
    "農業": ["農業", "耕種", "畜産", "酪農", "農場"],
    "漁業": ["漁業", "養殖", "水産"],
    "飲食料品製造業": ["食品製造", "飲食料品", "惣菜", "弁当", "食品工場", "加工食品"],
    "外食業": ["外食", "飲食店", "レストラン", "居酒屋", "調理", "ホール"],
    "林業": ["林業", "伐採"],
    "木材産業": ["木材", "製材"],
}

PREFECTURES = [
    "北海道", "青森", "岩手", "宮城", "秋田", "山形", "福島", "茨城", "栃木", "群馬", "埼玉", "千葉",
    "東京", "神奈川", "新潟", "富山", "石川", "福井", "山梨", "長野", "岐阜", "静岡", "愛知", "三重",
    "滋賀", "京都", "大阪", "兵庫", "奈良", "和歌山", "鳥取", "島根", "岡山", "広島", "山口", "徳島",
    "香川", "愛媛", "高知", "福岡", "佐賀", "長崎", "熊本", "大分", "宮崎", "鹿児島", "沖縄",
]


def _norm(s: str) -> str:
    # NFKC-ish: fullwidth digits/letters -> halfwidth, lowercase
    out = []
    for ch in s:
        o = ord(ch)
        if 0xFF01 <= o <= 0xFF5E:
            ch = chr(o - 0xFEE0)
        out.append(ch)
    return "".join(out).lower()


def detect_sector(text: str) -> str:
    best, hits = "", 0
    for name, kws in SECTORS.items():
        n = sum(len(k) for k in kws if k.lower() in text.lower())  # kata lebih spesifik = bobot lebih besar
        if n > hits:
            best, hits = name, n
    return best


def detect_prefecture(text: str) -> str:
    for p in PREFECTURES:
        if p in text:
            return p
    return ""


_MAN = re.compile(r"(\d+(?:\.\d+)?)\s*万")
_YEN = re.compile(r"(\d{1,3}(?:,\d{3})+|\d{5,7})\s*円")
_HOURLY = re.compile(r"時給\D{0,3}(\d{1,2},?\d{3})")
_ANNUAL = re.compile(r"年収")


def parse_monthly_salary(text: str) -> int | None:
    """Kembalikan perkiraan gaji bulanan terendah (yen), atau None bila tak terbaca."""
    t = _norm(text)
    if _ANNUAL.search(t):
        m = _MAN.search(t)
        if m:
            return int(float(m.group(1)) * 10000 / 12)
    h = _HOURLY.search(t)
    if h:
        return int(int(h.group(1).replace(",", "")) * 8 * 21)  # 8 jam x 21 hari
    m = _MAN.search(t)
    if m:
        return int(float(m.group(1)) * 10000)
    y = _YEN.search(t)
    if y:
        return int(y.group(1).replace(",", ""))
    return None


_JLPT = re.compile(r"n\s*([1-5])")


def required_jlpt(text: str) -> int | None:
    """Level JLPT terketat yang diminta (1=N1 paling sulit). None bila tak disebut."""
    t = _norm(text)
    levels = []
    for m in re.finditer(r"(?:日本語能力試験|日本語|jlpt)?\s*n\s*([1-5])\s*(?:以上|必須|取得|レベル)?", t):
        ctx = t[max(0, m.start() - 12): m.end() + 8]
        if any(k in ctx for k in ("日本語", "jlpt", "以上", "必須", "取得", "レベル")):
            levels.append(int(m.group(1)))
    return min(levels) if levels else None


def apply(jobs: list[Job], cfg: dict, now: datetime | None = None) -> tuple[list[Job], dict[str, int]]:
    now = now or datetime.utcnow()
    must = [_norm(x) for x in cfg["must_include"]]
    excl = [_norm(x) for x in cfg["exclude"]]
    excl_co = [_norm(x) for x in cfg.get("exclude_company_keywords", [])]
    allowed_sectors = set(cfg.get("allowed_sectors") or [])
    allowed_pref = cfg.get("allowed_prefectures") or []
    stats: dict[str, int] = {}
    kept: list[Job] = []
    seen: set[str] = set()

    def drop(why: str):
        stats[why] = stats.get(why, 0) + 1

    for j in jobs:
        if not j.url or not j.title:
            drop("data kosong"); continue
        key = j.url.split("?")[0]
        if key in seen:
            drop("duplikat"); continue
        seen.add(key)

        text = _norm(j.text)
        if not any(m in text for m in must):
            drop("tanpa kata 特定技能"); continue
        if any(e in text for e in excl):
            drop("kata terlarang"); continue
        if any(e in _norm(j.company) for e in excl_co):
            drop("perusahaan terlarang"); continue

        # umur
        if j.posted:
            if now - j.posted > timedelta(days=cfg["max_age_days"]):
                drop("terlalu lama"); continue
        elif cfg.get("require_posted_date"):
            drop("tanpa tanggal"); continue

        # sektor
        j.sector = detect_sector(j.text)
        if allowed_sectors and j.sector not in allowed_sectors:
            drop("sektor tidak diizinkan"); continue

        # lokasi
        if allowed_pref:
            pref = detect_prefecture(j.location + j.title + j.snippet)
            if pref not in allowed_pref:
                drop("prefektur tidak diizinkan"); continue

        # gaji
        sal = parse_monthly_salary(j.salary or j.snippet)
        if sal is None:
            if cfg.get("require_salary"):
                drop("gaji tak terbaca"); continue
        elif sal < cfg["min_monthly_salary_yen"]:
            drop("gaji terlalu rendah"); continue

        # JLPT
        lvl = required_jlpt(j.text)
        if lvl is not None and lvl < cfg["max_required_jlpt"]:
            drop("JLPT terlalu tinggi"); continue

        # skor
        score = 0
        for k, v in cfg["positive"].items():
            if _norm(k) in text:
                score += v; j.reasons.append(f"+{v} {k}")
        for k, v in cfg["negative"].items():
            if _norm(k) in text:
                score += v; j.reasons.append(f"{v} {k}")
        j.score = score
        if score < cfg["min_score"]:
            drop("skor rendah"); continue

        kept.append(j)

    kept.sort(key=lambda x: x.score, reverse=True)
    return kept, stats
