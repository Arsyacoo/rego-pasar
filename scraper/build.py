"""Build data/processed/ (latest.json, meta.json, history/<commodity>.json) from data/raw/.

If validation fails, nothing in data/processed/ is touched and the exit code is 1.
"""

import json
import sys
from datetime import date, datetime, timedelta, timezone
from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path
from typing import Any

from normalize import (
    PROCESSED_DIR,
    Observation,
    load_categories,
    load_commodities,
    load_observations,
    load_regions,
)

SOURCE = "Panel Harga Pangan, Badan Pangan Nasional"
WIB = timezone(timedelta(hours=7))
SPIKE_THRESHOLD_PCT = 10
MIN_DIY_COMMODITIES = 15

# series[commodity_id][region_id][date] = price or None
Series = dict[str, dict[str, dict[str, int | None]]]


def change_7d(prices: dict[str, int | None], day: str) -> float | None:
    """Percent change vs 7 days earlier, rounded to 1 decimal (half up).

    If the price 7 days earlier is missing, use the nearest earlier day within 3 more days.
    """
    current = prices.get(day)
    if current is None:
        return None
    target = date.fromisoformat(day) - timedelta(days=7)
    for extra in range(4):  # 7, 8, 9, 10 days back
        base = prices.get((target - timedelta(days=extra)).isoformat())
        if base is not None:
            pct = Decimal(current - base) / Decimal(base) * 100
            return float(pct.quantize(Decimal("0.1"), rounding=ROUND_HALF_UP))
    return None


def is_spike(change_pct: float | None) -> bool:
    return change_pct is not None and change_pct > SPIKE_THRESHOLD_PCT


def build_series(observations: list[Observation]) -> Series:
    series: Series = {}
    for region_id, commodity_id, day, price in observations:
        series.setdefault(commodity_id, {}).setdefault(region_id, {})[day] = price
    return series


def build_latest(
    series: Series, units: dict[str, str], updated_at: str
) -> dict[str, Any]:
    regions: dict[str, dict[str, Any]] = {}
    for commodity_id, by_region in series.items():
        for region_id, prices in by_region.items():
            day = max(prices)
            change = change_7d(prices, day)
            regions.setdefault(region_id, {})[commodity_id] = {
                "date": day,
                "price": prices[day],
                "unit": units[commodity_id],
                "change_7d_pct": change,
                "spike": is_spike(change),
            }
    return {"updated_at": updated_at, "source": SOURCE, "regions": regions}


def build_history(
    commodity_id: str, unit: str, by_region: dict[str, dict[str, int | None]]
) -> dict[str, Any]:
    return {
        "commodity": commodity_id,
        "unit": unit,
        "series": {
            region_id: [{"date": d, "price": prices[d]} for d in sorted(prices)]
            for region_id, prices in by_region.items()
        },
    }


def validate(series: Series, latest: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    for commodity_id, by_region in series.items():
        for region_id, prices in by_region.items():
            for day, price in prices.items():
                date.fromisoformat(day)  # raises on a malformed date
                if price is not None and (not isinstance(price, int) or price <= 0):
                    errors.append(
                        f"bad price {price!r}: {commodity_id}/{region_id}/{day}"
                    )
    diy = latest["regions"].get("diy", {})
    with_price = sum(1 for item in diy.values() if item["price"] is not None)
    if with_price < MIN_DIY_COMMODITIES:
        errors.append(
            f"only {with_price} DIY commodities have a latest price (< {MIN_DIY_COMMODITIES})"
        )
    return errors


def build_meta() -> dict[str, Any]:
    """Names for the page: categories, regions, commodities (from scraper/config only)."""
    categories = load_categories()
    category_ids = {c["id"] for c in categories}
    commodities = [
        {k: c[k] for k in ("id", "name", "category", "unit")}
        for c in load_commodities()
    ]
    unknown = [c["id"] for c in commodities if c["category"] not in category_ids]
    if unknown:
        raise ValueError(f"commodities with unknown category: {unknown}")
    return {
        "categories": categories,
        "regions": [{"id": r["id"], "name": r["name"]} for r in load_regions()],
        "commodities": commodities,
    }


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    tmp.write_text(
        json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
    )
    tmp.replace(path)


def main() -> int:
    commodities = load_commodities()
    units = {c["id"]: c["unit"] for c in commodities}
    series = build_series(load_observations())
    updated_at = datetime.now(WIB).replace(microsecond=0).isoformat()
    latest = build_latest(series, units, updated_at)

    errors = validate(series, latest)
    if errors:
        print("Validation failed; data/processed/ left unchanged:", file=sys.stderr)
        for error in errors:
            print(f"  {error}", file=sys.stderr)
        return 1

    for commodity_id, by_region in series.items():
        write_json(
            PROCESSED_DIR / "history" / f"{commodity_id}.json",
            build_history(commodity_id, units[commodity_id], by_region),
        )
    write_json(PROCESSED_DIR / "meta.json", build_meta())
    write_json(PROCESSED_DIR / "latest.json", latest)
    print(f"Wrote latest.json, meta.json and {len(series)} history files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
