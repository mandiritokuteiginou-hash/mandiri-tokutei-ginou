from datetime import datetime, timedelta

import yaml
from pathlib import Path

from agent import filters
from agent.models import Job

CFG = yaml.safe_load((Path(__file__).parents[1] / "agent/config.yaml").read_text(encoding="utf-8"))["filters"]
NOW = datetime(2026, 10, 7)


def job(**kw):
    base = dict(title="特定技能 食品製造スタッフ", url="https://x/1", company="A社",
                location="愛知県名古屋市", salary="月給 22万円",
                snippet="ビザサポートあり 寮完備 未経験歓迎 外国人歓迎", posted=NOW - timedelta(days=1))
    base.update(kw)
    return Job(**base)


def run(*jobs):
    return filters.apply(list(jobs), CFG, NOW)


def test_good_job_passes():
    kept, _ = run(job())
    assert len(kept) == 1 and kept[0].sector == "飲食料品製造業" and kept[0].score >= CFG["min_score"]


def test_reject_cases():
    cases = {
        "tanpa kata 特定技能": job(title="食品工場スタッフ", snippet="寮あり"),
        "kata terlarang": job(snippet="特定技能不可 寮"),
        "terlalu lama": job(posted=NOW - timedelta(days=60)),
        "gaji terlalu rendah": job(salary="月給 12万円"),
        "JLPT terlalu tinggi": job(snippet="日本語N2以上 ビザ 寮 外国人歓迎"),
        "skor rendah": job(snippet="特定技能", salary="月給 22万円"),
    }
    for why, j in cases.items():
        kept, stats = run(j)
        assert not kept and why in stats, (why, stats)


def test_n4_ok_and_dedupe():
    kept, stats = run(job(snippet="N4程度 ビザサポート 寮 外国人歓迎"), job())
    assert len(kept) == 1 and stats.get("duplikat") == 1


def test_salary_parsing():
    assert filters.parse_monthly_salary("月給 22万円") == 220000
    assert filters.parse_monthly_salary("月給220,000円") == 220000
    assert filters.parse_monthly_salary("時給1,200円") == 201600
    assert filters.parse_monthly_salary("年収 360万円") == 300000
    assert filters.parse_monthly_salary("相談") is None


def test_prefecture_filter():
    cfg = {**CFG, "allowed_prefectures": ["東京"]}
    kept, stats = filters.apply([job()], cfg, NOW)
    assert not kept and "prefektur tidak diizinkan" in stats
