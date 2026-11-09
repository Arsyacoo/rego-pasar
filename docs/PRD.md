# PRD: Rego Pasar

**Version:** 1.0 (draft)
**Date:** November 7, 2026
**Status:** Ready to build, pending phase 1 (data source check)

---

## 1. Summary

Rego Pasar (Javanese for "market price") is a web page that shows staple food prices in the Special Region of Yogyakarta (DIY) as summary cards, trend charts, a regency/city comparison, and price spike alerts. Data is pulled automatically every morning from official government sources.

**Primary goal:** a portfolio piece that demonstrates collecting, processing, and presenting data.
**Secondary goal:** open the door to a paid price-report service for food businesses in Yogyakarta.

## 2. Problem

Official food price data is already public, but it is published as long tables that are hard for ordinary people to read. Rego Pasar answers one question:

> Which staples are getting more expensive in Yogyakarta, in which regency, and by how much?

## 3. Users

| User | Need | What they look at first |
| --- | --- | --- |
| Food stall and restaurant owners | Know when to stock up or raise menu prices | Commodities that rose this week |
| Market traders | Compare prices across regencies in DIY | Price table by regency/city |
| Household shoppers | Plan monthly shopping | Today's price and the 30-day trend |
| Recruiters and prospective clients | Judge the builder's skills | A clean layout and correct data |

## 4. Scope

### 4.1 Regions

- DIY province average (default view)
- 5 regencies/cities: Kota Yogyakarta, Sleman, Bantul, Kulon Progo, Gunungkidul
- National average as a benchmark

### 4.2 Commodities

Every commodity available in Panel Harga Pangan, about 25 items in 5 categories. The final list depends on DIY data availability, confirmed in phase 1.

| Category | Commodities | Unit |
| --- | --- | --- |
| Rice and grains | Premium rice, medium rice, Bulog SPHP rice, feed corn, imported dried soybeans | kg |
| Spices and seasonings | Shallots, garlic (bonggol), curly red chili, large red chili, red bird's eye chili, consumption salt | kg |
| Meat and eggs | Pure beef, fresh local buffalo meat, frozen imported buffalo meat, broiler chicken, broiler eggs | kg |
| Fish | Mackerel (kembung), tuna (tongkol), milkfish (bandeng) | kg |
| Oil, sugar, flour | Packaged cooking oil, bulk cooking oil, Minyakita (liter); consumption sugar, packaged wheat flour, bulk wheat flour (kg) | liter / kg |

### 4.3 Out of scope for v1

- User accounts and login
- WhatsApp or Telegram notifications
- Provinces outside DIY
- Price forecasting
- Paid features

## 5. Data sources

| Source | Owner | Price levels | Role |
| --- | --- | --- | --- |
| Panel Harga Pangan (panelharga.badanpangan.go.id) | National Food Agency (Badan Pangan Nasional) | Producer and consumer | **Primary source**, daily consumer prices |
| PIHPS Nasional (bi.go.id/hargapangan) | Bank Indonesia | Traditional market, modern market, wholesale, producer | Cross-check and fallback |
| Satu Data Indonesia (data.go.id) | National Food Agency | Producer, monthly average | Historical data if needed |

**Price level used:** consumer (retail) prices, since they matter most to food stalls and households.

**Must be verified in phase 1:**

1. Whether regency/city-level data exists for DIY, and for which commodities.
2. Whether a public API or official download (JSON/CSV/XLSX) exists.
3. The terms of use, especially for commercial use.
4. How far back historical data goes (target: at least 90 days).

## 6. Functional requirements

| ID | Feature | Description | Priority |
| --- | --- | --- | --- |
| F1 | Today's summary | One card per commodity: latest price, unit, up/down arrow, 7-day percent change | Must |
| F2 | Category tabs | Cards grouped into 5 category tabs | Must |
| F3 | Region selector | Choose the DIY average or one of the 5 regencies/cities | Must |
| F4 | Trend chart | Line chart per commodity, range 7 / 30 / 90 days | Must |
| F5 | Region comparison | Table of one commodity across the 5 regencies/cities plus the national average, sortable, with the difference from national | Must |
| F6 | Spike alert | Red label when price rose more than 10% in 7 days | Must |
| F7 | Source info | Last update date, linked sources, and a note that this is not an official price source | Must |
| F8 | Missing data | Days or regions without data are marked "no data", never filled with guesses | Must |
| F9 | Commodity search | Search box to jump to a commodity | Nice to have |
| F10 | Biggest movers | Top 5 increases and top 5 decreases this week | Nice to have |

### Calculation rules

- **7-day change** = (today's price − price 7 days ago) ÷ price 7 days ago × 100%. If the price 7 days ago is missing, use the nearest earlier day within 3 days; otherwise show "–".
- **Spike** = 7-day change > +10%.
- **Difference from national** = regional price − national average price on the same date.
- Price format (UI, Indonesian locale): `Rp 45.200/kg` (dot as thousands separator, no decimals).
- Date format (UI): `7 Nov 2026`, Western Indonesia Time (WIB, UTC+7).

## 7. Non-functional requirements

| Aspect | Target |
| --- | --- |
| Mobile | Comfortable at 360 px width; no horizontal scrolling |
| Speed | Page renders in under 2 seconds on 4G |
| Cost | Rp 0 per month (free hosting and automation) |
| Reliability | If a fetch fails, the page keeps showing the last good data with its date |
| Accessibility | Sufficient text contrast; up/down never shown by color alone |
| UI language | Indonesian |
| Theme | Light and dark, following the device setting |

## 8. System flow

```
Panel Harga Pangan  ─┐
                     ├─> Fetch (every morning) ─> Clean + store (JSON) ─> Static web page
PIHPS (cross-check) ─┘
```

1. **Fetch:** a script runs automatically every day at 06:00 WIB and pulls prices for yesterday and today.
2. **Clean:** remove duplicates, normalize commodity names and units, mark missing data, compute percent changes.
3. **Store:** write JSON files into the repository.
4. **Display:** a static web page reads those JSON files.

## 9. Tech stack (proposed)

| Part | Choice | Reason |
| --- | --- | --- |
| Data fetcher | Python 3.12 + httpx | Simple, well documented, easy to test |
| Storage | JSON files in the repo | Free, with history via git |
| Web page | Vite + TypeScript + Chart.js | Lightweight, fast, no server |
| Automation | GitHub Actions (daily cron) | Free for public repositories |
| Hosting | GitHub Pages or Cloudflare Pages | Free, shareable link |
| Design | Claude Code + Impeccable skill | Consistent, non-generic design with critique and polish steps |

## 10. Phases

| Phase | Work | Output |
| --- | --- | --- |
| 1 | Check data sources (DIY availability, API, terms of use) | Data source notes + final commodity list |
| 2 | Fetcher script + initial 90 days of data | `data/` populated |
| 3 | Design with Impeccable: project context, 3 mockup directions, owner picks one | `.impeccable.md`, `design/`, `design/DECISION.md` |
| 4 | Web page (F1 to F8) in the chosen direction | Page running locally |
| 5 | Impeccable critique and refinement (typeset, colorize, harden, polish) | Approved design |
| 6 | Verify numbers against the source, check mobile layout | Test checklist passed |
| 7 | Deploy to hosting | Public link |
| 8 | Daily automation | Data updates every morning |

## 11. Definition of done for v1

- [ ] At least 15 commodities have DIY-average data for the last 90 days.
- [ ] 10 random numbers on the page match the source site for the same date.
- [ ] The page opens from a public link and works well on a phone.
- [ ] Data updates automatically for 3 consecutive days with no manual work.
- [ ] Data source and update date are clearly shown on the page.

## 12. Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Source has no API or download | Automated fetching is hard | Read from the site politely (delay between requests); if still hard, drop to weekly updates |
| Source site structure changes | Fetcher breaks | Validate output on every run; on failure keep old data and notify the owner |
| Incomplete regency data | Gaps in region comparison | Show only what exists; mark gaps clearly |
| Restrictive terms of use | Cannot sell reports | Read the terms before offering any paid service |

## 13. Future work

Weekly PDF reports for food businesses, spike alerts via WhatsApp/Telegram, other provinces in Java, a menu cost calculator, and client-specific dashboards. Build these only when real users ask for them.
