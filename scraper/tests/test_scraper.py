import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from build import build_latest, build_series, change_7d, is_spike, validate  # noqa: E402
from normalize import clean_price, parse_informasi, parse_peta  # noqa: E402


def test_change_7d_exact_day() -> None:
    prices = {"2026-11-01": 50000, "2026-11-08": 55000}
    assert change_7d(prices, "2026-11-08") == 10.0


def test_change_7d_falls_back_up_to_3_earlier_days() -> None:
    prices = {"2026-10-29": 40000, "2026-11-08": 50000}  # 10 days back
    assert change_7d(prices, "2026-11-08") == 25.0
    prices = {"2026-10-28": 40000, "2026-11-08": 50000}  # 11 days back: too far
    assert change_7d(prices, "2026-11-08") is None


def test_change_7d_uses_nearest_earlier_day() -> None:
    prices = {"2026-10-30": 40000, "2026-10-31": 45000, "2026-11-08": 50000}
    assert change_7d(prices, "2026-11-08") == 11.1  # vs 31 Oct, not 30 Oct


def test_change_7d_missing_values() -> None:
    assert change_7d({"2026-11-01": None, "2026-11-08": 50000}, "2026-11-08") is None
    assert change_7d({"2026-11-01": 50000, "2026-11-08": None}, "2026-11-08") is None


def test_change_7d_rounds_half_up() -> None:
    # 20025 / 20000 - 1 = 0.125% -> 0.1 ; 1.25% -> 1.3 (not banker's 1.2)
    assert change_7d({"2026-11-01": 20000, "2026-11-08": 20250}, "2026-11-08") == 1.3
    assert change_7d({"2026-11-01": 20000, "2026-11-08": 19750}, "2026-11-08") == -1.3


def test_is_spike() -> None:
    assert is_spike(10.1)
    assert not is_spike(10.0)
    assert not is_spike(None)


def test_clean_price() -> None:
    assert clean_price(52000) == 52000
    assert clean_price(0) is None
    assert clean_price(None) is None
    assert clean_price("52000") is None
    assert clean_price(51999.6) == 52000


def test_parse_peta_picks_diy_and_marks_missing() -> None:
    payload = {
        "data": [
            {"province_id": 13, "date": "2026-11-07", "rata_rata_geometrik": 60000},
            {"province_id": 14, "date": "2026-11-07", "rata_rata_geometrik": 58957},
        ]
    }
    assert parse_peta(payload, "2026-11-07", "cabai-rawit-merah") == [
        ("diy", "cabai-rawit-merah", "2026-11-07", 58957)
    ]
    assert parse_peta({"data": []}, "2026-11-07", "x") == [
        ("diy", "x", "2026-11-07", None)
    ]


def test_parse_informasi_uses_dated_yesterday() -> None:
    payload = {
        "data": [
            {
                "id": 33,
                "today": 50714,
                "yesterday": 54286,
                "yesterday_date": "06-11-2026",
            },
            {"id": 102, "today": 0, "yesterday": 0, "yesterday_date": "06-11-2026"},
            {"id": 999, "today": 1, "yesterday": 1, "yesterday_date": "06-11-2026"},
        ]
    }
    mapping = {33: "cabai-rawit-merah", 102: "jagung-tk-peternak"}
    assert parse_informasi(payload, "sleman", mapping) == [
        ("sleman", "cabai-rawit-merah", "2026-11-06", 54286),
        ("sleman", "jagung-tk-peternak", "2026-11-06", None),
    ]


def test_validate_rejects_too_few_diy_prices() -> None:
    series = build_series([("diy", "a", "2026-11-06", 1000)])
    latest = build_latest(series, {"a": "kg"}, "2026-11-07T06:00:00+07:00")
    assert any("DIY commodities" in e for e in validate(series, latest))
