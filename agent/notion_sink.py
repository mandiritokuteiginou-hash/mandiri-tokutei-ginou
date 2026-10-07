"""Tulis hasil ke database Notion (REST API). Dedup berdasarkan properti URL."""
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

import requests

from .models import Job

API = "https://api.notion.com/v1"
VERSION = "2022-06-28"


def _h() -> dict:
    return {
        "Authorization": f"Bearer {os.environ['NOTION_TOKEN']}",
        "Notion-Version": VERSION,
        "Content-Type": "application/json",
    }


def setup_database(parent_page_id: str) -> str:
    """Buat database dengan skema yang dibutuhkan di bawah sebuah halaman."""
    body = {
        "parent": {"type": "page_id", "page_id": parent_page_id},
        "title": [{"type": "text", "text": {"content": "Lowongan Tokutei Ginou"}}],
        "properties": {
            "Judul": {"title": {}},
            "Perusahaan": {"rich_text": {}},
            "Lokasi": {"rich_text": {}},
            "Gaji": {"rich_text": {}},
            "Sektor": {"select": {}},
            "Skor": {"number": {}},
            "Sumber": {"select": {}},
            "URL": {"url": {}},
            "Diposting": {"date": {}},
            "Ditemukan": {"date": {}},
            "Catatan": {"rich_text": {}},
            "Status": {"select": {"options": [
                {"name": "Baru", "color": "blue"},
                {"name": "Dilamar", "color": "yellow"},
                {"name": "Ditolak", "color": "red"},
            ]}},
        },
    }
    r = requests.post(f"{API}/databases", headers=_h(), json=body, timeout=30)
    r.raise_for_status()
    return r.json()["id"]


def _exists(db: str, url: str) -> bool:
    r = requests.post(
        f"{API}/databases/{db}/query",
        headers=_h(),
        json={"filter": {"property": "URL", "url": {"equals": url}}, "page_size": 1},
        timeout=30,
    )
    r.raise_for_status()
    return bool(r.json()["results"])


def _txt(s: str) -> dict:
    return {"rich_text": [{"text": {"content": s[:1900]}}]} if s else {"rich_text": []}


def push(jobs: list[Job], db: str, limit: int = 100) -> int:
    jst = timezone(timedelta(hours=9))
    today = datetime.now(jst).date().isoformat()
    added = 0
    for j in jobs:
        if added >= limit:
            break
        url = j.url.split("#")[0]
        if _exists(db, url):
            continue
        props = {
            "Judul": {"title": [{"text": {"content": j.title[:200]}}]},
            "Perusahaan": _txt(j.company),
            "Lokasi": _txt(j.location),
            "Gaji": _txt(j.salary),
            "Skor": {"number": j.score},
            "Sumber": {"select": {"name": j.source[:100] or "?"}},
            "URL": {"url": url},
            "Ditemukan": {"date": {"start": today}},
            "Catatan": _txt("; ".join(j.reasons)),
            "Status": {"select": {"name": "Baru"}},
        }
        if j.sector:
            props["Sektor"] = {"select": {"name": j.sector}}
        if j.posted:
            props["Diposting"] = {"date": {"start": j.posted.date().isoformat()}}
        r = requests.post(f"{API}/pages", headers=_h(),
                          json={"parent": {"database_id": db}, "properties": props}, timeout=30)
        if r.status_code >= 400:
            print(f"[notion] gagal {url}: {r.status_code} {r.text[:200]}")
            continue
        added += 1
    return added
