# CLAUDE.md — Rego Pasar

Guidance for Claude when working in this repository. The full spec lives in `docs/PRD.md`; read it before adding features.

## About the project

Rego Pasar is a static web page showing staple food prices in DIY (Special Region of Yogyakarta): the provincial average plus Kota Yogyakarta, Sleman, Bantul, Kulon Progo, and Gunungkidul, benchmarked against the national average. Data is fetched automatically every morning from Panel Harga Pangan (National Food Agency), with Bank Indonesia's PIHPS as a cross-check.

The project owner is not an experienced programmer and relies on Claude for the technical side. Explain changes in plain language, and reply to the owner in Indonesian.

## Folder structure

```
rego-pasar/
├── CLAUDE.md
├── docs/
│   ├── PRD.md               # product spec
│   ├── PROMPTS.md           # step-by-step prompts for the owner
│   └── data-sources.md      # data source findings (written in phase 1)
├── design/                  # Impeccable mockups + DECISION.md
├── PRODUCT.md               # product context for Impeccable (created by /impeccable teach)
├── scraper/                 # Python: fetch and clean data
│   ├── fetch.py             # pull raw data from sources
│   ├── normalize.py         # normalize names and units, mark missing data
│   ├── build.py             # compute changes, write final JSON
│   ├── config/
│   │   ├── commodities.yaml # commodity list, category, unit, source ids
│   │   ├── categories.yaml  # category ids and names, in page order
│   │   └── regions.yaml     # region list and source ids
│   └── tests/
├── data/
│   ├── raw/                 # raw responses by date (never edit by hand)
│   └── processed/
│       ├── latest.json      # today's summary for all regions
│       ├── meta.json        # names: categories, regions, commodities (from config)
│       └── history/         # one file per commodity, 90+ days
├── web/                     # Vite + TypeScript, hand-drawn SVG map and chart
│   ├── index.html
│   ├── scripts/build_map.py # geoBoundaries -> src/diy-map.json
│   └── src/
└── .github/workflows/
    └── update-data.yml      # daily cron at 06:00 WIB (23:00 UTC)
```

## Commands

```bash
# Scraper (from scraper/)
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
python fetch.py --days 1        # fetch latest data
python fetch.py --days 90       # backfill initial data
python build.py                 # clean and write data/processed/
pytest                          # run tests

# Web (from web/)
npm install
npm run dev                     # open http://localhost:5173 (reads ../data/processed)
npm run build                   # output to web/dist/
```

## Data rules (mandatory)

- **Never invent or guess a price.** Missing values are stored as `null` and shown as "tidak ada data" (no data).
- Never edit files in `data/raw/` by hand.
- Price level: **consumer (retail) prices** only.
- Store all dates as `YYYY-MM-DD` in Western Indonesia Time (Asia/Jakarta).
- Store prices as integer rupiah (no decimals). Record the unit per commodity (`kg` or `liter`).
- Commodity names and ids come only from `scraper/config/commodities.yaml`.
- When fetching from source sites: wait at least 1 second between requests, send a clear User-Agent naming the project, and respect robots.txt and the terms of use.
- If a fetch fails or its output fails validation, **do not overwrite** `data/processed/`. The last good data must stay visible.

## JSON formats

`data/processed/latest.json`:

```json
{
  "updated_at": "2026-11-07T06:00:00+07:00",
  "source": "Panel Harga Pangan, Badan Pangan Nasional",
  "regions": {
    "diy": {
      "cabai-rawit-merah": {
        "date": "2026-11-07",
        "price": 52000,
        "unit": "kg",
        "change_7d_pct": 12.4,
        "spike": true
      }
    }
  }
}
```

`data/processed/history/<commodity-id>.json`:

```json
{
  "commodity": "cabai-rawit-merah",
  "unit": "kg",
  "series": {
    "diy": [{ "date": "2026-08-09", "price": 48500 }],
    "nasional": [{ "date": "2026-08-09", "price": 51200 }]
  }
}
```

Commodity and region ids are kebab-case Indonesian names (e.g. `cabai-rawit-merah`, `kulon-progo`), matching the source naming.

## Calculation rules

- 7-day change = (today's price − price 7 days ago) ÷ price 7 days ago × 100, rounded to 1 decimal. If the price 7 days ago is missing, use the nearest earlier day within 3 days; otherwise `null`.
- `spike` = `true` when the 7-day change is > 10.
- Write calculations as pure functions and cover them with tests.

## UI rules

- All user-facing text in Indonesian.
- Price format `Rp 45.200/kg`; date format `7 Nov 2026`.
- Mobile first: comfortable at 360 px width, no horizontal scrolling.
- Show up/down with an arrow **and** a color, never color alone.
- Light and dark themes follow the device setting.
- The footer must include linked data sources, the last update date, and a note that Rego Pasar is not an official price source.

## Design (Impeccable)

- All visual design work uses the **Impeccable** skill. Before changing anything visual, read `PRODUCT.md` (and `DESIGN.md` once it exists) and follow them.
- If `PRODUCT.md` does not exist yet, stop and ask the owner to run `/impeccable teach` first.
- Design mockups live in `design/` as static HTML, using real sample data from `data/processed/`, never placeholder numbers.
- The chosen direction is recorded in `design/DECISION.md` (which mockup, and why). The page in `web/` must follow it.
- After any significant UI change, run an Impeccable critique on `web/` and fix only the items the owner approves.
- Refine in this order: typeset, colorize, harden, polish. One command per step; show the result before moving on.
- Design must never break the UI rules above (Indonesian text, arrows plus color, 360 px mobile, light and dark themes).

## Code style

- Python: format with `ruff format`, lint with `ruff check`, use type hints.
- TypeScript: `strict` mode, no `any`.
- Variable and function names in English; user-facing text in Indonesian.
- Keep changes small and focused; do not add dependencies without a clear reason.

## Before calling work done

1. Scraper tests pass (`pytest`).
2. `npm run build` succeeds with no errors.
3. At least 3 numbers on the page match the source site for the same date.
4. The layout has been checked at phone width.
