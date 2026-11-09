# Verification — phase 6

**Checked on:** 9 Nov 2026, with the data fetched that morning (prices for **8 Nov 2026**, consumer level).

## Method

1. `pytest` in `scraper/`: 10 passed. `ruff check` and `ruff format --check`: clean. `npm run build` in `web/`: no errors.
2. Ten prices picked at random from everything the page shows (`random.seed(20261109)` over all non-empty region × commodity prices in `data/processed/latest.json`).
3. Each one requested **again** from the source, with fresh requests through the open endpoints the official site uses, and parsed separately from `normalize.py`:
   - DIY average: `harga-peta-provinsi`, `province_id 14`, the explicit `date`.
   - Regencies and national: `harga-pangan-informasi`, the `yesterday` value with its `yesterday_date`.
4. The same ten read back from the **rendered page**, not from the JSON: list rows per region tab, and the "Nasional" row of the region table for national prices.

The website itself (panelharga.badanpangan.go.id, 9 Nov 2026) now offers only the producer level ("Produsen") in its public price view, so consumer prices cannot be read off its screens. The check therefore compares against the same endpoints that the website calls, at `level_harga_id=3`.

## Result: 10 of 10 match

| Region | Commodity | Page | Source (8 Nov 2026) |
| --- | --- | --- | --- |
| Gunungkidul | Ikan Kembung | Rp 45.667/kg | 45667 |
| DIY | Kedelai Impor | Rp 11.627/kg | 11627 |
| Nasional | Bawang Merah | Rp 34.509 | 34509 |
| Kota Yogyakarta | Beras SPHP | Rp 12.450/kg | 12450 |
| Bantul | Kedelai Impor | Rp 12.300/kg | 12300 |
| Kulon Progo | Telur Ayam Ras | Rp 24.000/kg | 24000 |
| Kulon Progo | Tepung Terigu Kemasan | Rp 12.167/kg | 12167 |
| Gunungkidul | Minyak Goreng Curah | Rp 18.200/liter | 18200 |
| DIY | Ikan Kembung | Rp 47.750/kg | 47750 |
| Nasional | Beras SPHP | Rp 12.460 | 12460 |

No mismatches, so nothing needed fixing.

## Note on "today" values

The source revises the current day's numbers while the day is still open. For example, national Cabai Merah Keriting for 7 Nov was 79.369 when read as "today" on 7 Nov, and 79.327 when read as "yesterday" on 8 Nov. Rego Pasar uses only the "yesterday" value, which is final. A check made against the source's "today" figure can therefore differ by a small amount without anything being wrong.

## Layout

At 360 px, in light and dark mode, all six region tabs were checked: no horizontal scroll on the page, the commodity list or the region table. The map, region table, list with the trend panel opened inside it, and footer render as designed.

## Not covered

- Real phones (iPhone/Safari, Android): every tap was simulated in Chrome.
- A PIHPS cross-check. PIHPS measures traditional-market prices, so it is a sanity check rather than an exact match, and phase 6 did not call for it.
