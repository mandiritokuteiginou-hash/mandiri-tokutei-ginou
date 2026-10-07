"""Tahap-2 opsional: Claude memverifikasi lowongan yang lolos filter aturan."""
from __future__ import annotations

import json
import os

import requests

from .models import Job

PROMPT = """Anda memverifikasi lowongan kerja untuk visa Jepang 特定技能 (Specified Skilled Worker).
Jawab HANYA JSON: {"ok": true|false, "reason": "<alasan singkat, Bahasa Indonesia>"}.
ok=true hanya jika lowongan JELAS membuka posisi untuk pekerja asing dengan status 特定技能
(bukan hanya 技能実習, bukan khusus orang Jepang, bukan agen/spam, bukan pekerjaan paruh waktu).
Bila ragu, ok=false.

Judul: {title}
Perusahaan: {company}
Lokasi: {location}
Gaji: {salary}
Deskripsi: {snippet}"""


def verify(jobs: list[Job], cfg: dict) -> list[Job]:
    key = os.environ.get("ANTHROPIC_API_KEY")
    if not cfg.get("enabled") or not key:
        print("[llm] dinonaktifkan / tanpa API key -> lewati")
        return jobs
    kept: list[Job] = []
    for i, j in enumerate(jobs):
        if i >= cfg["max_jobs"]:
            kept.append(j)  # di luar batas: sudah lolos filter aturan
            continue
        try:
            r = requests.post(
                "https://api.anthropic.com/v1/messages",
                headers={"x-api-key": key, "anthropic-version": "2023-06-01"},
                json={
                    "model": cfg["model"],
                    "max_tokens": 200,
                    "messages": [{"role": "user", "content": PROMPT.format(
                        title=j.title, company=j.company, location=j.location,
                        salary=j.salary, snippet=j.snippet[:1500])}],
                },
                timeout=60,
            )
            r.raise_for_status()
            txt = r.json()["content"][0]["text"]
            res = json.loads(txt[txt.index("{"): txt.rindex("}") + 1])
        except Exception as e:
            print(f"[llm] error {j.url}: {e} -> pertahankan")
            kept.append(j)
            continue
        if res.get("ok"):
            j.reasons.append(f"AI: {res.get('reason', '')}")
            kept.append(j)
        else:
            print(f"[llm] tolak {j.title[:40]}: {res.get('reason')}")
    return kept
