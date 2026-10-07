"""Jooble API (gratis, mendukung Jepang): https://jooble.org/api/about"""
from __future__ import annotations

import html
import re
from datetime import datetime

import requests

from ..models import Job

TAG = re.compile(r"<[^>]+>")


def _clean(s: str) -> str:
    return html.unescape(TAG.sub(" ", s or "")).strip()


def _parse_date(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00")).replace(tzinfo=None)
    except ValueError:
        return None


def fetch(api_key: str, queries: list[str], locations: list[str], pages: int = 2) -> list[Job]:
    jobs: list[Job] = []
    for q in queries:
        for loc in locations or [""]:
            for page in range(1, pages + 1):
                r = requests.post(
                    f"https://jooble.org/api/{api_key}",
                    json={"keywords": q, "location": loc or "Japan", "page": page},
                    timeout=30,
                )
                r.raise_for_status()
                items = r.json().get("jobs", [])
                if not items:
                    break
                for it in items:
                    jobs.append(
                        Job(
                            title=_clean(it.get("title", "")),
                            url=it.get("link", ""),
                            company=_clean(it.get("company", "")),
                            location=_clean(it.get("location", "")),
                            salary=_clean(it.get("salary", "")),
                            snippet=_clean(it.get("snippet", "")),
                            source="Jooble",
                            posted=_parse_date(it.get("updated")),
                        )
                    )
    return jobs
