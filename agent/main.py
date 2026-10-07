from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

import yaml

from . import filters, llm_check, notion_sink
from .sources import jooble, rss

CONFIG = Path(__file__).with_name("config.yaml")


def collect(cfg: dict):
    jobs = []
    key = os.environ.get("JOOBLE_API_KEY")
    if key:
        s = cfg["sources"]["jooble"]
        jobs += jooble.fetch(key, s["queries"], s["locations"], s["pages"])
    else:
        print("[warn] JOOBLE_API_KEY kosong -> Jooble dilewati")
    if cfg["sources"].get("rss_feeds"):
        jobs += rss.fetch(cfg["sources"]["rss_feeds"])
    return jobs


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="jangan tulis ke Notion")
    ap.add_argument("--setup", metavar="PARENT_PAGE_ID", help="buat database Notion lalu keluar")
    a = ap.parse_args()

    if a.setup:
        print("NOTION_DATABASE_ID =", notion_sink.setup_database(a.setup))
        return 0

    cfg = yaml.safe_load(CONFIG.read_text(encoding="utf-8"))
    raw = collect(cfg)
    print(f"[collect] {len(raw)} lowongan mentah")
    kept, stats = filters.apply(raw, cfg["filters"])
    print(f"[filter] lolos {len(kept)}; ditolak: {stats}")
    kept = llm_check.verify(kept, cfg["llm"])
    print(f"[llm] final {len(kept)}")

    if a.dry_run:
        for j in kept:
            print(f"- [{j.score}] {j.title} | {j.company} | {j.sector} | {j.url}")
        return 0
    db = os.environ.get("NOTION_DATABASE_ID")
    if not (db and os.environ.get("NOTION_TOKEN")):
        print("NOTION_TOKEN / NOTION_DATABASE_ID belum diset", file=sys.stderr)
        return 1
    n = notion_sink.push(kept, db, cfg["notion"]["max_per_run"])
    print(f"[notion] {n} lowongan baru ditambahkan")
    return 0


if __name__ == "__main__":
    sys.exit(main())
