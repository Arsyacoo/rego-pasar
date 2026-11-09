"""Turn raw Panel Harga Pangan responses into clean observations.

An observation is (region_id, commodity_id, date "YYYY-MM-DD", price or None).
A price of 0 from the source means "no data" and becomes None. Prices are never guessed.
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / "data" / "raw"
PROCESSED_DIR = ROOT / "data" / "processed"
CONFIG_DIR = Path(__file__).resolve().parent / "config"

DIY_PROVINCE_ID = 14

Observation = tuple[str, str, str, int | None]


def load_commodities() -> list[dict[str, Any]]:
    return yaml.safe_load((CONFIG_DIR / "commodities.yaml").read_text(encoding="utf-8"))


def load_categories() -> list[dict[str, Any]]:
    return yaml.safe_load((CONFIG_DIR / "categories.yaml").read_text(encoding="utf-8"))


def load_regions() -> list[dict[str, Any]]:
    return yaml.safe_load((CONFIG_DIR / "regions.yaml").read_text(encoding="utf-8"))


def clean_price(value: Any) -> int | None:
    """Source price to integer rupiah. 0, empty, or non-numbers mean no data."""
    if isinstance(value, bool) or not isinstance(value, (int, float)) or value <= 0:
        return None
    return int(round(value))


def parse_peta(
    payload: dict[str, Any], day: str, commodity_id: str
) -> list[Observation]:
    """harga-peta-provinsi response for one commodity and one day -> DIY observation."""
    for row in payload["data"]:
        if row.get("province_id") == DIY_PROVINCE_ID and row.get("date") == day:
            return [
                ("diy", commodity_id, day, clean_price(row.get("rata_rata_geometrik")))
            ]
    return [("diy", commodity_id, day, None)]


def parse_informasi(
    payload: dict[str, Any], region_id: str, panel_to_commodity: dict[int, str]
) -> list[Observation]:
    """harga-pangan-informasi response -> observations for the source's "yesterday".

    Only "yesterday" is used: it carries an explicit date and is complete.
    "today" has no date and may still be filling in when the job runs at 06:00 WIB.
    """
    observations: list[Observation] = []
    for row in payload["data"]:
        commodity_id = panel_to_commodity.get(row.get("id"))
        if commodity_id is None:
            continue
        day = datetime.strptime(row["yesterday_date"], "%d-%m-%Y").date().isoformat()
        observations.append(
            (region_id, commodity_id, day, clean_price(row.get("yesterday")))
        )
    return observations


def load_observations(raw_dir: Path = RAW_DIR) -> list[Observation]:
    """Read every raw file, oldest first, so later fetches win on duplicates."""
    commodities = load_commodities()
    panel_to_commodity = {c["panel_id"]: c["id"] for c in commodities}
    observations: list[Observation] = []

    # data/raw/peta/<YYYY-MM-DD>/<panel_id>.json
    for path in sorted(raw_dir.glob("peta/*/*.json")):
        commodity_id = panel_to_commodity.get(int(path.stem))
        if commodity_id is None:
            continue
        payload = json.loads(path.read_text(encoding="utf-8"))
        observations += parse_peta(payload, path.parent.name, commodity_id)

    # data/raw/informasi/<fetch date>/<region_id>.json
    for path in sorted(raw_dir.glob("informasi/*/*.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        observations += parse_informasi(payload, path.stem, panel_to_commodity)

    return observations
