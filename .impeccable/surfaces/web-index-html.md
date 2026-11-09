---
version: 1
slug: "web-index-html"
primary_target: "web/index.html"
related_targets: ["design/a-peta.html"]
---

# Surface brief: Rego Pasar main page (web/index.html)

**Mode:** Operate. One page; the visitor reads which staples rose, where, and by how much.
**Audience:** recruiters and prospective clients judging data craft; real-world use by warung owners, traders, households in DIY.
**Constraints:** PRODUCT.md and CLAUDE.md UI rules (Indonesian, arrow + color, 360 px, light/dark by device, footer sources + not-official note, "tidak ada data" for gaps). Code-led build (no image generation).
**Reference:** approved mockup `design/a-peta.html`; choice recorded in `design/DECISION.md`.
**Open:** real regency boundaries for the map (mockup is schematic); Chart.js vs hand-drawn SVG profile.

## Direction contract

THESIS: Price as terrain. The DIY average is sea level; each regency is land or sea by how far its price sits above or below it (national stays in the comparison table). Refuses the KPI-tile dashboard of equal cards.
OWN-WORLD: Indonesian topographic sheet (Peta Rupabumi): deep sea-blue collar band, near-white sheet, seven stepped hypsometric tints (three sea blues, pale coast, sand, ochre, brown), contour-brown hairlines, red for rises, sea blue for falls, both only for change over time. Archivo with condensed caps for map lettering, tabular numerals.
STORY: The visitor sees the week's biggest rise first, sees on the map where it is cheapest or dearest against the DIY average, then scans every commodity, opens a trend, and compares regions.
FIRST VIEWPORT: Collar with wordmark, data date, region tabs. Left 5/12: the answer headline, price, spike tag, rises and falls. Right 7/12: the DIY map with commodity select, legend ramp, sea-level caption. Signature: the map is the region selector; the trend chart is an elevation profile with contour lines.
FORM: candidate 5 of 7 (Peta DIY / cartography); seed key 560d0b5b.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
