# Rego Pasar — Prompts to Run

Copy each prompt into Claude Code, in order. Finish and check one step before starting the next.
At the end of every step that works, run the **commit** prompt at the bottom.

---

## Setup (once)

In a terminal:

```
cd D:\coding\rego-pasar
git init
claude
```

Claude Code reads `CLAUDE.md` automatically every session.

---

## Step 1 — Check data sources

```
Read docs/PRD.md and CLAUDE.md. Start phase 1 only: investigate Panel Harga Pangan and PIHPS as data sources for DIY. Find out whether regency/city-level data exists, which commodities are available, whether there is a public API or download, the terms of use, and how far back history goes. Write your findings to docs/data-sources.md with links, and propose the final commodity list. Do not write any scraper code yet.
```

**Check:** open `docs/data-sources.md`. Is DIY data available? If not, discuss before continuing.

---

## Step 2 — Data fetcher

```
Using docs/data-sources.md, build phase 2: the scraper in scraper/ (fetch.py, normalize.py, build.py, config files, tests). Backfill 90 days of data into data/. Follow the data rules in CLAUDE.md strictly. Run the tests and show me a sample of the output.
```

**Check:** `data/processed/latest.json` exists and has real prices.

---

## Step 3 — Design setup with Impeccable

Run:

```
/impeccable teach
```

(If not recognized, try `/teach-impeccable`. Type `/impeccable` alone to see available commands.)

When it asks about the project, paste:

```
Product: Rego Pasar, a daily staple food price tracker for Yogyakarta (DIY), Indonesia.
Audience: food stall owners, market traders, and household shoppers, mostly on phones; also recruiters viewing it as a portfolio piece.
Job of the page: answer in 30 seconds which staples got more expensive, where, and by how much.
Tone: local, trustworthy, practical; feels like a Jogja market, not a bank dashboard.
UI language: Indonesian. Light and dark themes. Mobile first at 360 px.
Constraints: up/down must use arrows plus color, never color alone; prices like "Rp 45.200/kg".
```

**Check:** `.impeccable.md` now exists in the project folder.

---

## Step 4 — Pick a design direction

```
Read docs/PRD.md and .impeccable.md. Propose 3 distinct visual directions for Rego Pasar as static HTML mockups in design/ (direction-1.html, direction-2.html, direction-3.html), each using real sample data from data/processed/. Show today's summary cards, category tabs, one trend chart, and the region table. Keep them lightweight; I will pick one.
```

**Check:** open the 3 files in your browser and pick one. Then:

```
I pick direction [1/2/3] because [your reason]. Record this in design/DECISION.md.
```

---

## Step 5 — Build the page

```
Build phase 4: the web page in web/ following design/DECISION.md and .impeccable.md. Implement F1 to F8 from the PRD, reading from data/processed/. Run it locally and tell me how to open it.
```

**Check:** open the page; try the tabs, region selector, and chart ranges.

---

## Step 6 — Critique

```
/impeccable critique web/
```

Then tell Claude which items to fix, for example:

```
Fix items 1, 3 and 4 from the critique. Skip the rest.
```

---

## Step 7 — Refine (one at a time, check after each)

```
/impeccable typeset web/
```

```
/impeccable colorize web/
```

```
/impeccable harden web/
```

```
/impeccable polish web/
```

---

## Step 8 — Verify the numbers

```
Phase 6: pick 10 random prices shown on the page and check them against the source site for the same date. Report any mismatches and fix them. Then check the layout at 360 px width in light and dark mode.
```

---

## Step 9 — Publish and automate

First create an empty **public** repository named `rego-pasar` on github.com yourself. Then:

```
Phases 7 and 8: connect this project to my GitHub repository [paste the repo URL], deploy the site to GitHub Pages, and set up the daily GitHub Actions workflow at 06:00 WIB. Walk me through anything I need to click myself.
```

**Check:** the public link opens, and the next morning the update date changes.

---

## Commit (after every step that works)

```
Commit this step with a clear message.
```

## When something breaks

```
Something went wrong: [describe what you see or paste the error]. Explain the cause in simple Indonesian and fix it.
```
