# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + TypeScript (strict) + Chart.js, static output to `web/dist/`, reading JSON from `data/processed/`. Hosting: GitHub Pages or Cloudflare Pages (free). Decided in `docs/PRD.md` §9; no web scaffold exists yet.

## Users

- **Primary: recruiters and prospective clients.** They judge the builder's skill at collecting, cleaning, and presenting real data. They arrive from a portfolio link or CV, usually skim on a laptop or phone for a minute or two, and decide whether the work is credible and well made.
- **Secondary (the page's real-world use case, which the primary audience evaluates):** food stall and restaurant owners (which staples rose this week), market traders (prices across regencies/cities), and household shoppers (today's price and 30-day trend), all in DIY.

## Product Purpose

Rego Pasar (Javanese for "market price") turns official, hard-to-read government price tables into a clear page that answers one question: which staples are getting more expensive in Yogyakarta, in which regency, and by how much?

Success: a recruiter or prospective client sees correct, current numbers presented so clearly that the data pipeline behind them is obviously sound. Secondary goal: open the door to a paid price-report service for food businesses in Yogyakarta (not in v1).

## Positioning

Local and specific: DIY province average plus Kota Yogyakarta, Sleman, Bantul, Kulon Progo, and Gunungkidul, benchmarked against the national average, updated automatically every morning from Panel Harga Pangan (Badan Pangan Nasional). The source publishes the same data as long tables; Rego Pasar's value is the reading layer (summary, 7-day change, spike flags, regional comparison) on top of verified data.

## Operating Context

- Data refreshes daily at 06:00 WIB via GitHub Actions; prices shown are the previous day's final consumer (retail) prices.
- Rego Pasar is not an official price source and must say so; it links to its sources.
- Regency/city and national history only began accumulating on 6 Nov 2026 (no public backfill exists); the DIY average has 90+ days. Short regional history is a known, honest state, not a bug.

## Capabilities and Constraints

- v1 features (PRD §6): today's summary cards (F1), 5 category tabs (F2), region selector (F3), trend chart 7/30/90 days (F4), region comparison table with difference from national (F5), spike alert >10% in 7 days (F6), source info (F7), explicit "tidak ada data" for gaps (F8). Nice to have: search (F9), biggest movers (F10).
- 23 commodities in 5 categories, defined only in `scraper/config/commodities.yaml`.
- Never invent or interpolate a price. Missing = "tidak ada data".
- Price format `Rp 45.200/kg`; date format `7 Nov 2026`; WIB.
- Up/down always shown with an arrow and a color, never color alone.
- Mobile first: comfortable at 360 px, no horizontal scrolling. Page renders in under 2 s on 4G.
- Light and dark themes follow the device setting.
- Out of scope for v1: accounts, notifications, other provinces, forecasting, paid features.

## Brand Commitments

- Name: **Rego Pasar**.
- Voice: casual everyday Indonesian (bahasa Indonesia santai), no Javanese beyond the product name. All user-facing text in Indonesian.
- Attribution: "Sumber: Panel Harga Pangan, Badan Pangan Nasional", with links. PIHPS (Bank Indonesia) data is used only for internal cross-checks and is never shown.

## Evidence on Hand

- Real data: `data/processed/latest.json` and `data/processed/history/*.json` (23 commodities; DIY 9 Aug–6 Nov 2026; regions and national from 6 Nov 2026). Mockups and pages must use these numbers, never placeholders.
- Source findings: `docs/data-sources.md`.
- No logo, testimonials, users, or press exist. Do not fabricate any.

## Product Principles

1. **Correct before pretty.** Every number traces to the source for a stated date; gaps are shown, never filled.
2. **Answer the one question first.** What went up, where, by how much — visible before anything else.
3. **Show the craft through clarity.** The portfolio value is a clean, trustworthy reading of messy public data, not decoration.
4. **Honest about limits.** Not an official source; short regional history is labeled, not hidden.
5. **Local, not generic.** Yogyakarta's regencies and everyday staples are the subject.

## Accessibility & Inclusion

No product-specific needs beyond the general standard: sufficient text contrast, direction never shown by color alone, comfortable at 360 px.
