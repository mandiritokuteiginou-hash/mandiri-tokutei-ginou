"""Sumber RSS/Atom generik. Daftarkan feed di config.yaml -> sources.rss_feeds."""
from __future__ import annotations

import html
import re
import xml.etree.ElementTree as ET
from datetime import datetime
from email.utils import parsedate_to_datetime

import requests

from ..models import Job

TAG = re.compile(r"<[^>]+>")


def _t(el, name):
    x = el.find(name)
    return (x.text or "").strip() if x is not None and x.text else ""


def fetch(feeds: list[str]) -> list[Job]:
    jobs: list[Job] = []
    for url in feeds:
        try:
            r = requests.get(url, timeout=30, headers={"User-Agent": "tokutei-agent/1.0"})
            r.raise_for_status()
            root = ET.fromstring(r.content)
        except Exception as e:  # satu feed rusak tidak boleh menggagalkan semua
            print(f"[rss] skip {url}: {e}")
            continue
        for it in root.iter("item"):
            posted = None
            try:
                posted = parsedate_to_datetime(_t(it, "pubDate")).replace(tzinfo=None)
            except Exception:
                pass
            jobs.append(
                Job(
                    title=html.unescape(_t(it, "title")),
                    url=_t(it, "link"),
                    snippet=html.unescape(TAG.sub(" ", _t(it, "description"))),
                    source=f"RSS:{url.split('/')[2]}",
                    posted=posted,
                )
            )
    return jobs
