"""Fetch raw prices from Panel Harga Pangan (Badan Pangan Nasional) into data/raw/.

- DIY average, one file per commodity per day (harga-peta-provinsi):
  data/raw/peta/<YYYY-MM-DD>/<panel_id>.json   -> history, explicit dates
- Each regency/city and national, one file per region per run (harga-pangan-informasi):
  data/raw/informasi/<fetch date>/<region_id>.json   -> only today/yesterday exist

Raw files are saved byte-for-byte and never overwritten; existing files are skipped,
so an interrupted backfill can simply be run again.

Usage: python fetch.py --days 1   |   python fetch.py --days 90
"""

import argparse
import json
import sys
import time
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from normalize import RAW_DIR, load_commodities, load_regions

API = "https://api-panelhargav2.badanpangan.go.id/api"
USER_AGENT = "RegoPasar/0.1 (non-commercial food price project for DIY)"
DELAY_SECONDS = 1.2  # politeness: at least 1 s between requests
RETRIES = 3
CONSUMER_LEVEL = 3  # level_harga_id 3 = consumer (retail) prices
WIB = timezone(timedelta(hours=7))  # Asia/Jakarta, no DST


def get_json(path: str, params: dict[str, Any]) -> bytes:
    """GET an API path; return the raw body once it is a valid success response."""
    url = f"{API}/{path}?{urllib.parse.urlencode(params)}"
    request = urllib.request.Request(
        url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"}
    )
    last_error: Exception | None = None
    for attempt in range(1, RETRIES + 1):
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                body: bytes = response.read()
            payload = json.loads(body)
            if payload.get("status") != "success" or not isinstance(
                payload.get("data"), list
            ):
                raise ValueError(f"unexpected response: {body[:200]!r}")
            return body
        except Exception as error:  # network, HTTP, JSON, or shape errors
            last_error = error
            time.sleep(DELAY_SECONDS * attempt * 3)
        finally:
            time.sleep(DELAY_SECONDS)
    raise RuntimeError(f"{url} failed after {RETRIES} attempts: {last_error}")


def save(path: Path, body: bytes) -> None:
    """Write atomically so a crash never leaves a half-written raw file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    tmp.write_bytes(body)
    tmp.replace(path)


def fetch_peta(day: date, panel_id: int) -> bytes:
    period = f"{day:%d/%m/%Y} - {day:%d/%m/%Y}"  # the API uses only the first date
    return get_json(
        "front/harga-peta-provinsi",
        {
            "level_harga_id": CONSUMER_LEVEL,
            "komoditas_id": panel_id,
            "period_date": period,
            "multi_status_map[0]": "",
            "multi_province_id[0]": "",
        },
    )


def fetch_informasi(region: dict[str, Any]) -> bytes:
    return get_json(
        "front/harga-pangan-informasi",
        {
            "province_id": region["panel_province_id"] or "",
            "city_id": region["panel_city_id"] or "",
            "level_harga_id": CONSUMER_LEVEL,
        },
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--days", type=int, default=1, help="days of DIY history, ending yesterday"
    )
    args = parser.parse_args()

    today = datetime.now(WIB).date()
    failures: list[str] = []

    # 1. Regencies/cities and national: today's snapshot (contains yesterday's final prices).
    for region in load_regions():
        if region["id"] == "diy":
            continue  # DIY comes from harga-peta-provinsi, which has explicit dates
        path = RAW_DIR / "informasi" / today.isoformat() / f"{region['id']}.json"
        if path.exists():
            continue
        try:
            save(path, fetch_informasi(region))
            print(f"ok   {path.relative_to(RAW_DIR)}")
        except RuntimeError as error:
            failures.append(str(error))
            print(f"FAIL {error}", file=sys.stderr)

    # 2. DIY average: one request per commodity per day, newest first.
    commodities = load_commodities()
    for offset in range(1, args.days + 1):
        day = today - timedelta(days=offset)
        for commodity in commodities:
            path = RAW_DIR / "peta" / day.isoformat() / f"{commodity['panel_id']}.json"
            if path.exists():
                continue
            try:
                save(path, fetch_peta(day, commodity["panel_id"]))
                print(f"ok   {path.relative_to(RAW_DIR)}")
            except RuntimeError as error:
                failures.append(str(error))
                print(f"FAIL {error}", file=sys.stderr)

    if failures:
        print(
            f"{len(failures)} request(s) failed; run again to retry.", file=sys.stderr
        )
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
