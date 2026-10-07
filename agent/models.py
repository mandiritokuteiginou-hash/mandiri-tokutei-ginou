from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Job:
    title: str
    url: str
    company: str = ""
    location: str = ""
    salary: str = ""
    snippet: str = ""
    source: str = ""
    posted: datetime | None = None
    # diisi oleh filter
    sector: str = ""
    score: int = 0
    reasons: list[str] = field(default_factory=list)

    @property
    def text(self) -> str:
        return f"{self.title}\n{self.company}\n{self.location}\n{self.salary}\n{self.snippet}"
