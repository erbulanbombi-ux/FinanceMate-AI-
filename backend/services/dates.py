from __future__ import annotations

from datetime import datetime, timezone


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def month_period(value: datetime | None = None) -> str:
    return (value or utc_now()).strftime("%Y-%m")


def month_start(period: str) -> datetime:
    try:
        parsed = datetime.strptime(period, "%Y-%m")
    except ValueError as exc:
        raise ValueError("period must be a valid month in YYYY-MM format") from exc
    if parsed.strftime("%Y-%m") != period:
        raise ValueError("period must be a valid month in YYYY-MM format")
    return parsed.replace(tzinfo=timezone.utc)


def next_month(period: str) -> str:
    start = month_start(period)
    if start.month == 12:
        return f"{start.year + 1}-01"
    return f"{start.year}-{start.month + 1:02d}"


def previous_month(period: str) -> str:
    start = month_start(period)
    if start.month == 1:
        return f"{start.year - 1}-12"
    return f"{start.year}-{start.month - 1:02d}"
