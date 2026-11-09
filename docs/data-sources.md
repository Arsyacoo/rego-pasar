# Data sources — phase 1 findings

**Checked on:** 7 Nov 2026 (all sample numbers below are from this day, consumer level)
**Status:** phase 1 done. No scraper code written yet.

## TL;DR

| Question (PRD §5) | Panel Harga Pangan (Bapanas) | PIHPS (Bank Indonesia) |
| --- | --- | --- |
| Regency/city data for DIY? | **Yes, all 5** (Kota Yogyakarta, Sleman, Bantul, Kulon Progo, Gunungkidul) — but only for *today and yesterday* through the public endpoint | **Only Kota Yogyakarta** |
| Commodities | 27 consumer items; **24 have DIY data** | 21 items (traditional market), fewer than Panel |
| Public API / download? | No official API or download. The website uses an undocumented JSON API; a few endpoints are open, the history/table/export ones need an API key or login | No official API. The website uses an undocumented JSON endpoint that is open and returns date ranges in one call |
| Terms of use | No terms page found; no explicit licence | Footer: "Hak Cipta © 2022 PIHPS Nasional - Semua Hak Dilindungi"; BI asks users to cite BI as the source |
| History depth | Province level: daily back to at least Jan 2022 (sparse in 2021). Regency level: **not available publicly** | Back to at least Jan 2018, weekdays only |

**Decision:** Panel Harga Pangan stays the primary source. DIY-average history (90+ days) can be backfilled. Regency and national history cannot be backfilled from public endpoints, so they start accumulating from the first day the fetcher runs. PIHPS is used only as a cross-check for Kota Yogyakarta and the national level.

---

## 1. Panel Harga Pangan (Badan Pangan Nasional)

- Website: <https://panelharga.badanpangan.go.id/>
  - Update 9 Nov 2026: the public price view on the website now offers only the producer level ("Produsen"). The open API still answers at the consumer level (`level_harga_id=3`). See `verification.md`.
- API base used by the website: `https://api-panelhargav2.badanpangan.go.id/api`
- `robots.txt` of the API host: `Disallow: /login`, `Disallow: /cms-panel` (the endpoints below are allowed). The website host has no real `robots.txt` (it returns the app's HTML).

### 1.1 Endpoints that work without login

All are `GET` and return JSON. No API key needed (checked 7 Nov 2026).

| Endpoint | What it returns | Use for |
| --- | --- | --- |
| `/provinces?search=` | Province list. DIY = `id 14` ("D.I Yogyakarta") | config |
| `/cities?province_id=14` | 5 cities/regencies of DIY (ids below) | config |
| `/front/harga-pangan-informasi?province_id=&city_id=&level_harga_id=3` | All 27 commodities for one region: `today`, `yesterday`, `yesterday_date`, change | **Daily prices for DIY, each regency, and national** |
| `/front/harga-peta-provinsi?level_harga_id=3&komoditas_id=<id>&period_date=DD/MM/YYYY - DD/MM/YYYY&multi_status_map[0]=&multi_province_id[0]=` | One commodity, one day, every province (`rata_rata_geometrik`, explicit `date`) | **DIY-average history backfill** |

Notes:

- `level_harga_id=3` = consumer (retail) level; `1` = producer. Use `3` only.
- `province_id` empty = national average; `province_id=14` = DIY average; add `city_id` for a regency.
- `harga-pangan-informasi` ignores any date parameter: it only gives today and yesterday.
- `harga-peta-provinsi` uses only the **first** date of `period_date`, so it is one request per commodity per day. It covers provinces only (no national row, no regencies).
- A price of `0` means "no data". Store it as `null`, never as 0.
- Data exists on weekends too (e.g. Sunday 1 Nov 2026 has DIY values).
- Values are already rounded rupiah integers.

Region ids:

| Region | Panel id | Rego Pasar id |
| --- | --- | --- |
| DIY (province average) | `province_id=14` | `diy` |
| Kab. Kulon Progo | `city_id=221` | `kulon-progo` |
| Kab. Bantul | `city_id=222` | `bantul` |
| Kab. Gunungkidul | `city_id=223` | `gunungkidul` |
| Kab. Sleman | `city_id=224` | `sleman` |
| Kota Yogyakarta | `city_id=225` | `kota-yogyakarta` |
| National | `province_id=` (empty) | `nasional` |

### 1.2 Endpoints that are closed

These return `401 "Unauthorized. Invalid or missing API key."` (or `Unauthenticated.`):

- `/front/harga-pangan-table-v2` (date-range table by province/regency — the one we would want for regency history)
- `/front/harga-pangan-bulanan-v2`, `/front/harga-pangan-table-province`, `/front/komoditas`, all `.../export` endpoints
- everything under `/cms/...`

The website's table and chart pages ("Statistik Harga") also ask visitors to log in. **We will not try to get around the key or the login.** If regency history is needed, the right move is to ask Bapanas for access (see §4).

### 1.3 History depth

Checked with `harga-peta-provinsi`, cabai rawit merah, DIY:

| Date | DIY price |
| --- | --- |
| 3 Jan 2021 | no DIY row (only 1 province reported) |
| 2 Jan 2022 | Rp 66.200 |
| 1 Nov 2024 | Rp 32.929 |
| 1 Aug 2026 | Rp 42.318 |
| 7 Nov 2026 | Rp 58.957 (same as `harga-pangan-informasi` today) |

Spot check of **all 27 commodities** for DIY on 9 Aug 2026 and 1 Oct 2026: 24 have values on both dates; Beras Khusus (Lokal), Daging Kerbau Beku, and Daging Kerbau Segar have none.

So the 90-day DIY target in PRD §11 is reachable. Regency history is not (only today/yesterday). National history is not available from these open endpoints either.

### 1.4 Availability by region (7 Nov 2026, Rp, consumer level)

`0` = no data from the source.

| Panel id | Commodity | Unit | DIY | Kota Yk | Kulon Progo | Bantul | Gunungkidul | Sleman | National |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 27 | Beras Premium | kg | 15404 | 14991 | 14950 | 16167 | 15833 | 15600 | 16208 |
| 28 | Beras Medium | kg | 13567 | 12800 | 14500 | 13833 | 13758 | 14233 | 13688 |
| 109 | Beras SPHP | kg | 12415 | 12450 | 0 | 12000 | 12500 | 12400 | 12480 |
| 165 | Beras Medium Non SPHP | kg | 13808 | 13150 | 14500 | 14167 | 13867 | 14600 | 14560 |
| 166 | Beras Khusus (Lokal) | kg | 0 | 0 | 0 | 0 | 0 | 0 | 16421 |
| 102 | Jagung Tk Peternak | kg | 7300 | 0 | 7233 | 7500 | 0 | 0 | 7394 |
| 29 | Kedelai Biji Kering (Impor) | kg | 11642 | 11000 | 11400 | 12300 | 12100 | 11800 | 12059 |
| 30 | Bawang Merah | kg | 32793 | 30714 | 26667 | 32800 | 36000 | 34286 | 34638 |
| 31 | Bawang Putih Bonggol | kg | 32538 | 34143 | 30333 | 30000 | 34857 | 30286 | 35966 |
| 32 | Cabai Merah Keriting | kg | 60435 | 55429 | 53333 | 60000 | 67000 | 66667 | 79369 |
| 126 | Cabai Merah Besar | kg | 49611 | 45000 | 58333 | 56250 | 60000 | 39333 | 61685 |
| 33 | Cabai Rawit Merah | kg | 58957 | 50714 | 60000 | 58750 | 68500 | 58333 | 85197 |
| 107 | Garam Konsumsi | kg | 11848 | 12000 | 16500 | 6667 | 12833 | 10000 | 11582 |
| 34 | Daging Sapi Murni | kg | 156765 | 154167 | 161667 | 158333 | 150000 | 165000 | 145809 |
| 152 | Daging Kerbau Segar (Lokal) | kg | 0 | 0 | 0 | 0 | 0 | 0 | 150400 |
| 149 | Daging Kerbau Beku (Impor) | kg | 0 | 0 | 0 | 0 | 0 | 0 | 119072 |
| 35 | Daging Ayam Ras | kg | 35857 | 37000 | 35667 | 33667 | 37333 | 33000 | 38230 |
| 36 | Telur Ayam Ras | kg | 23820 | 24000 | 24000 | 23000 | 24571 | 22500 | 28014 |
| 104 | Ikan Kembung | kg | 47750 | 47333 | 55000 | 48333 | 45667 | 44000 | 46223 |
| 105 | Ikan Tongkol | kg | 43588 | 46333 | 42000 | 44000 | 41667 | 40000 | 38456 |
| 106 | Ikan Bandeng | kg | 44308 | 45333 | 0 | 47500 | 43667 | 39000 | 37787 |
| 38 | Minyak Goreng Kemasan | liter | 21827 | 20111 | 24667 | 22000 | 22643 | 22000 | 23046 |
| 101 | Minyak Goreng Curah | liter | 18750 | 19571 | 18750 | 19000 | 18140 | 17600 | 19013 |
| 127 | Minyakita | liter | 17015 | 15700 | 15667 | 19500 | 18917 | 15500 | 16855 |
| 37 | Gula Konsumsi | kg | 18222 | 17500 | 20167 | 18833 | 18143 | 18500 | 19153 |
| 108 | Tepung Terigu Kemasan | kg | 12060 | 11100 | 12167 | 12000 | 13667 | 12000 | 13268 |
| 40 | Tepung Terigu (Curah) | kg | 9848 | 9813 | 9333 | 10000 | 10000 | 10000 | 10180 |

### 1.5 Terms of use

- No terms-of-use, licence, or API page was found on the site (the FAQ page is empty; the API is undocumented).
- The data is published openly for the public by a government agency. Bapanas regulations on food data ([Perbadan 21/2023 on the food and nutrition information system](https://peraturan.bpk.go.id/Download/368149/Peraturan%20Badan%20Pangan%2021%20Tahun%202023%20tentang%20SI%20Pangan%20dan%20Gizi.pdf), [Perbadan 3/2023 on Satu Data Pangan](https://pasal.id/peraturan/perban/peraturan-bapanas-no-3-tahun-2023)) aim for data that is easy to access and share, but they do not grant a licence for reuse.
- **For v1 (free portfolio site):** OK to use with clear attribution ("Sumber: Panel Harga Pangan, Badan Pangan Nasional"), polite request rate, and a note that Rego Pasar is not an official source.
- **Before any paid service:** get written permission from Bapanas. Not clear today.

---

## 2. PIHPS Nasional (Bank Indonesia)

- Website: <https://www.bi.go.id/hargapangan> (moved here from hargapangan.id on 1 July 2023)
- Table page: <https://www.bi.go.id/hargapangan/TabelHarga/PasarTradisionalDaerah>
- `robots.txt` of www.bi.go.id: `Allow: /`; `/hargapangan` is not disallowed.

### 2.1 Endpoints (open, undocumented)

Base: `https://www.bi.go.id/hargapangan/WebSite/TabelHarga`

| Endpoint | Returns |
| --- | --- |
| `GetRefPriceType` | 1 Pasar Tradisional, 2 Pasar Modern, 3 Pedagang Besar, 4 Produsen |
| `GetRefProvince?price_type_id=1` | DIY = `id 15` ("DI Yogyakarta") |
| `GetRefRegency?price_type_id=1&ref_prov_id=15` | **Only** `41 Kota Yogyakarta` |
| `GetRefCommodityAndCategory` | 21 commodities (`com_1`…`com_21`) |
| `GetGridDataDaerah?price_type_id=1&comcat_id=&province_id=15&regency_id=&market_id=&tipe_laporan=1&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` | One row per commodity, one column per date (`"DD/MM/YYYY": "66,750"`, comma thousands). Empty `province_id` = national. |

- A 90-day range comes back in one request (~2.5 s).
- Weekdays only (no Saturday/Sunday columns).
- History goes back to at least Jan 2018.
- For DIY the "province" figure is really Kota Yogyakarta markets only.

### 2.2 Commodities

Beras Kualitas Bawah I/II, Medium I/II, Super I/II; Daging Ayam Ras Segar; Daging Sapi Kualitas 1/2; Telur Ayam Ras Segar; Bawang Merah/Putih Ukuran Sedang; Cabai Merah Besar, Cabai Merah Keriting, Cabai Rawit Hijau, Cabai Rawit Merah; Minyak Goreng Curah, Kemasan Bermerk 1/2; Gula Pasir Kualitas Premium, Gula Pasir Lokal. All listed in **kg** (including cooking oil, while Panel uses liter).

No fish, flour, salt, soybeans, or corn.

### 2.3 How it compares

PIHPS and Panel use different markets, samples and methods. Example, cabai rawit merah, Kota Yogyakarta, 6 Nov 2026: PIHPS Rp 66.750 vs Panel Rp 54.286. National, same day: PIHPS Rp 96.700 vs Panel Rp 84.051. So the cross-check should compare **direction and size of weekly change**, not exact prices, and PIHPS numbers must never be mixed into Panel series.

### 2.4 Terms of use

- Footer: "Hak Cipta © 2022 PIHPS Nasional - Semua Hak Dilindungi" (all rights reserved).
- [Privacy policy](https://www.bi.go.id/hargapangan/privacypolicy) covers personal data only, not data reuse.
- BI's general rule for its published data is that users must name Bank Indonesia as the source ([FAQ PBI 12/2024](https://www.bi.go.id/id/publikasi/peraturan/Documents/FAQ_PBI_122024.pdf)).
- Internal cross-check use is low risk. **Do not republish PIHPS numbers on the page** without permission; for commercial use, ask BI (BI Bicara, 131, bicara@bi.go.id).

---

## 3. Satu Data Indonesia (data.go.id)

Not checked in depth. PRD lists it only as a monthly producer-price fallback, which is the wrong price level for v1. Skip unless Panel history disappears.

---

## 4. Consequences for the build

1. **DIY average** (default view): backfill 90 days from `harga-peta-provinsi` — 23 commodities × 90 days ≈ 2,070 requests, ~45 min at 1.2 s per request. One-time job.
2. **Regencies and national**: only `harga-pangan-informasi` is open, so history starts the day the daily job starts. For the first weeks, the regency comparison table (F5) works, but regency and national trend lines (F4) will be short. The UI must show "tidak ada data" for earlier days. Optional: email Bapanas to ask for API access for `harga-pangan-table-v2`.
3. **Daily job**: 7 requests to `harga-pangan-informasi` (DIY, 5 regencies, national) + 23 to `harga-peta-provinsi` for yesterday's DIY values with an explicit date. At 06:00 WIB today's figures are probably not complete yet, so store **yesterday's** values with `yesterday_date` (verify in phase 2 by comparing a 06:00 run with a midday run).
4. **7-day change** for regencies needs 7 days of collected data first; until then `change_7d_pct` is `null`.
5. Treat `0` as `null`. Validate: every value is an integer > 0 or null; at least 15 DIY commodities present; otherwise do not overwrite `data/processed/`.
6. The API is undocumented and can change without notice. Keep raw responses in `data/raw/`, validate on every run (PRD §12).
7. User-Agent example: `RegoPasar/0.1 (+<repo URL>)` — no personal email.

---

## 5. Proposed final commodity list (23)

Rule: keep items with DIY-average data today **and** 90 days back. Dropped: Beras Khusus (Lokal), Daging Kerbau Segar (Lokal), Daging Kerbau Beku (Impor) — no DIY data at all. Also dropped Beras Medium Non SPHP (`165`): it overlaps Beras Medium and would confuse readers; easy to add back.

| Category | id | Name on page | Panel id | Unit | PIHPS cross-check (Kota Yk / national) |
| --- | --- | --- | --- | --- | --- |
| Beras & biji-bijian | `beras-premium` | Beras Premium | 27 | kg | `com_5` Super I (approx.) |
| | `beras-medium` | Beras Medium | 28 | kg | `com_3` Medium I |
| | `beras-sphp` | Beras SPHP | 109 | kg | — |
| | `jagung-tk-peternak` | Jagung Pakan (Tingkat Peternak) | 102 | kg | — |
| | `kedelai-biji-kering-impor` | Kedelai Impor | 29 | kg | — |
| Bumbu | `bawang-merah` | Bawang Merah | 30 | kg | `com_11` |
| | `bawang-putih-bonggol` | Bawang Putih Bonggol | 31 | kg | `com_12` |
| | `cabai-merah-keriting` | Cabai Merah Keriting | 32 | kg | `com_14` |
| | `cabai-merah-besar` | Cabai Merah Besar | 126 | kg | `com_13` |
| | `cabai-rawit-merah` | Cabai Rawit Merah | 33 | kg | `com_16` |
| | `garam-konsumsi` | Garam Konsumsi | 107 | kg | — |
| Daging & telur | `daging-sapi-murni` | Daging Sapi Murni | 34 | kg | `com_8` Kualitas 1 |
| | `daging-ayam-ras` | Daging Ayam Ras | 35 | kg | `com_7` |
| | `telur-ayam-ras` | Telur Ayam Ras | 36 | kg | `com_10` |
| Ikan | `ikan-kembung` | Ikan Kembung | 104 | kg | — |
| | `ikan-tongkol` | Ikan Tongkol | 105 | kg | — |
| | `ikan-bandeng` | Ikan Bandeng | 106 | kg | — |
| Minyak, gula, tepung | `minyak-goreng-kemasan` | Minyak Goreng Kemasan | 38 | liter | `com_18` (kg — trend only) |
| | `minyak-goreng-curah` | Minyak Goreng Curah | 101 | liter | `com_17` (kg — trend only) |
| | `minyakita` | Minyakita | 127 | liter | — |
| | `gula-konsumsi` | Gula Konsumsi | 37 | kg | `com_21` Lokal |
| | `tepung-terigu-kemasan` | Tepung Terigu Kemasan | 108 | kg | — |
| | `tepung-terigu-curah` | Tepung Terigu Curah | 40 | kg | — |

Known gaps by regency (7 Nov 2026): Jagung missing in Kota Yogyakarta, Gunungkidul, Sleman; Beras SPHP and Ikan Bandeng missing in Kulon Progo. These show as "tidak ada data".

23 ≥ 15, so PRD §11's "at least 15 commodities with 90 days of DIY data" is met.

---

## 6. Open questions for the owner

1. OK to drop the 3 no-data items and Beras Medium Non SPHP?
2. OK that regency and national trend charts start short and fill up day by day? Or should we email Bapanas for API access first?
3. Paid reports (secondary goal) need written permission from Bapanas (and BI if PIHPS is used). Not needed for v1.
