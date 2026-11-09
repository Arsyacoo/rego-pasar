---
name: Rego Pasar
description: Staple food prices in Yogyakarta, read as terrain against the DIY average.
colors:
  collar-sea: "#12385a"
  collar-ink: "#f2f6f8"
  collar-ink-muted: "#b8cddd"
  sheet-ground: "#f6f8f4"
  panel-white: "#ffffff"
  ink: "#1b2326"
  ink-muted: "#4b5759"
  rule: "#d6dbd3"
  rule-strong: "#1b2326"
  contour-brown: "#8f5a30"
  rise-red: "#b8322a"
  fall-blue: "#1d64a8"
  spike-red: "#b3302a"
  focus-ochre: "#a87000"
  sea-deep: "#3d77ad"
  sea-mid: "#78a7d2"
  sea-shallow: "#b9d4ea"
  coast: "#ebe8da"
  land-low: "#e8c985"
  land-mid: "#d7a35a"
  land-high: "#ad6b35"
  no-data: "#e3e6e1"
  map-edge: "#4b5759"
  row-hover: "#eff1ec"
  row-selected: "#e3eaf0"
typography:
  display:
    fontFamily: "Archivo Variable, Archivo Fallback, system-ui, sans-serif"
    fontSize: "clamp(30px, 3.6vw, 46px)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  wordmark:
    fontFamily: "Archivo Variable, Archivo Fallback, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.06em"
    fontVariation: "'wdth' 70"
  headline:
    fontFamily: "Archivo Variable, Archivo Fallback, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    letterSpacing: "-0.01em"
    fontFeature: "'tnum'"
  body:
    fontFamily: "Archivo Variable, Archivo Fallback, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "'tnum'"
  table:
    fontFamily: "Archivo Variable, Archivo Fallback, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    fontFeature: "'tnum'"
  label:
    fontFamily: "Archivo Variable, Archivo Fallback, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 650
    letterSpacing: "0.08em"
    fontVariation: "'wdth' 75"
  map-label:
    fontFamily: "Archivo Variable, Archivo Fallback, system-ui, sans-serif"
    fontSize: "11.5px"
    fontWeight: 700
    letterSpacing: "0.1em"
    fontVariation: "'wdth' 72"
  note:
    fontFamily: "Archivo Variable, Archivo Fallback, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
rounded:
  none: "0px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  section: "28px"
components:
  region-tab:
    backgroundColor: "transparent"
    textColor: "{colors.collar-ink-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "10px 14px 12px"
  region-tab-active:
    textColor: "{colors.collar-ink}"
  panel:
    backgroundColor: "{colors.panel-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
  panel-header:
    typography: "{typography.label}"
    padding: "12px 16px"
  chip-filter:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "6px 12px"
  chip-filter-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.panel-white}"
  segmented:
    backgroundColor: "{colors.panel-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "5px 12px"
  segmented-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.panel-white}"
  select:
    backgroundColor: "{colors.panel-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "6px 30px 6px 10px"
  spike-tag:
    backgroundColor: "{colors.spike-red}"
    textColor: "#ffffff"
    rounded: "{rounded.none}"
    padding: "3px 8px 3px 6px"
  table-cell:
    textColor: "{colors.ink}"
    typography: "{typography.table}"
    padding: "10px 16px"
  table-row-selected:
    backgroundColor: "{colors.row-selected}"
---

# Design System: Rego Pasar

## Overview

**Creative North Star: "The Price Survey Sheet"**

Rego Pasar is drawn as an Indonesian topographic map sheet (Peta Rupabumi). The DIY average price is sea level; each regency is land or sea by how far its price sits above or below it. The national average stays as a number in the comparison table. A deep sea-blue collar band carries the title and region tabs, a near-white sheet holds square, hairline-ruled panels, and all colour that is not ink belongs either to the hypsometric scale or to the rise/fall pair.

The page is dense and calm, the density of a printed survey sheet rather than a dashboard. Depth comes from rules and tints, not from cards floating on shadows. Lettering follows map practice: condensed, letterspaced caps for place names and panel titles, a heavy upright grotesque for the one answer headline, and tabular numerals everywhere a price appears.

The signature is that the map and the chart are instruments, not decoration: the map is the region selector and the trend chart is an elevation profile with contour lines.

**Key Characteristics:**
- One typeface (Archivo Variable), varied by width and weight, never by family.
- Square corners on every surface and control.
- Hairline rules (1px) separate; a 2px ink rule opens a block.
- Seven-step hypsometric ramp is the only categorical colour scale.
- Direction always carries an SVG arrow and a colour together.
- Light and dark themes follow the device; both are defined token-for-token.

## Colors

A cartographer's palette: survey-sheet neutrals, a sea-blue frame, and elevation tints that mean something.

### Primary
- **Collar Sea** (#12385a): the header and footer bands only. It frames the sheet like a map collar and is also the browser theme colour and favicon ground. Text on it uses Collar Ink (#f2f6f8) and Collar Ink Muted (#b8cddd).

### Secondary
- **Rise Red** (#b8322a): price rises over time, the "Kenaikan berikutnya" heading. Always paired with an up arrow.
- **Fall Blue** (#1d64a8): price falls over time, the "Penurunan terbesar" heading. Always paired with a down arrow.
- **Spike Red** (#b3302a): background of the "Lonjakan" tag only, with white text.

### Tertiary
- **Contour Brown** (#8f5a30): contour hairlines and their labels in the price profile, the Merapi peak marker. Cartographic furniture, never body text.
- **Hypsometric ramp** (Sea Deep #3d77ad, Sea Mid #78a7d2, Sea Shallow #b9d4ea, Coast #ebe8da, Land Low (sand) #e8c985, Land Mid (ochre) #d7a35a, Land High (brown) #ad6b35): the map fill and legend ramp, banded at −20, −10, −3, +3, +10, +20 percent against the DIY average. Blue against brown stays readable for red-green colour blindness. No Data (#e3e6e1) fills a regency without a price.
- **Map Edge** (#4b5759; the panel colour in dark): regency boundaries, so the pale Coast step still reads on a white panel.
- **Collar Gold** (#e6d58a): active-tab underline and focus outline on the collar. Land Mid is the text-selection highlight.

### Neutral
- **Sheet Ground** (#f6f8f4): page background, a faintly green-grey paper.
- **Panel White** (#ffffff): panel and control surfaces.
- **Ink** (#1b2326): text, the strong rule, chart line, active control fill.
- **Ink Muted** (#4b5759): secondary text, units, notes, axis labels, "tidak ada data".
- **Rule** (#d6dbd3): hairline borders and row dividers.
- **Row Selected** (#e3eaf0, a pale collar tint) and Row Hover (#eff1ec): table row states.
- **Focus Ochre** (#a87000): keyboard focus outline on the sheet; at least 3:1 against Panel White, Sheet Ground and Row Selected.

Dark theme (prefers-color-scheme: dark) redefines every token in `web/src/style.css`: ground #0e1517, panel #141d20, ink #e6ecea, rise #ff7b6e, fall #74b3ef, focus #ffc94a, a dimmed ramp, map edges in the panel colour, and the map selection stroke switches to #ffc94a.

### Named Rules
**The Sea Level Rule.** Blue means cheaper than the DIY average; sand, ochre and brown mean dearer. The ramp is used only for regency price against the DIY average. Difference from national is a level, not a movement: it is set in Ink with an explicit sign and a percentage, never in Rise Red or Fall Blue.

**The Arrow-and-Colour Rule.** Rise Red and Fall Blue mark change over time only, and never appear on a number without the matching SVG arrow. Colour is never the only signal.

## Typography

**Display Font:** Archivo Variable (falls back to "Archivo Fallback", local Arial resized to Archivo's width and vertical metrics so the font swap does not reflow the page, then system-ui)
**Body Font:** Archivo Variable
**Label Font:** Archivo Variable at condensed width (wdth 70–80)

**Character:** One grotesque stretched and compressed the way a map sheet uses one alphabet at several widths. Wide, heavy upright for the answer; condensed letterspaced caps for names on the map and panel titles.

### Hierarchy
- **Display** (800, clamp(30px, 3.6vw, 46px), 1.05, −0.02em, balanced wrap): the single answer headline ("Cabai Merah Keriting naik 10,1% dalam seminggu"). One per page.
- **Wordmark** (800, 28px / 24px under 560px, width 70%, uppercase, 0.06em): "REGO PASAR" in the collar, with a 15px regular tagline in Collar Ink Muted.
- **Headline** (700, 30px, −0.01em): the lead price under the display.
- **Body** (400, 16px, 1.5): running text; supporting lines capped at 46ch.
- **Table** (400, 15px; 14px under 560px): data rows. Units drop to 13px Ink Muted.
- **Label** (650, 11–14px, width 75–80%, uppercase, 0.07–0.08em): panel titles, column heads, region tabs, the spike tag.
- **Map Label** (700, 11.5px floor, width 72%, uppercase, 0.1em, halo stroke): regency names on the map; prices beneath at 600. Sea and peak names are italic. Labels on the pale tiles (Sea Shallow, Coast, Sand) are always dark Ink with a white halo, in both themes; elsewhere they follow Map Ink.
- **Note** (400, 12–13px, Ink Muted): captions, map note, list note, stamps.

### Named Rules
**The Tabular Rule.** `font-variant-numeric: tabular-nums` is set on body; every price column aligns digit for digit.

**The One Family Rule.** Contrast comes from width (wdth 62–125) and weight (100–900) of Archivo. No second family.

## Layout

A 1240px max sheet with 24px gutters (16px under 560px). The first viewport is a 5/12 + 7/12 grid: the answer and region comparison on the left, the map panel spanning both rows on the right. Below, a 7/12 + 5/12 grid holds the full commodity table and a sticky price profile. Section and grid gaps are 28px (22px on phones); panels pad 16px horizontally, 12px for headers.

At 960px both grids collapse to one column (answer, map, comparison; then the list) and the price profile opens inside the commodity list, in a detail row under the selected commodity on a Row Selected ground. Tapping another row moves it there and keeps the tapped row where it was on screen, so the list never jumps back up. When a category chip filters the selected commodity out, the panel hides rather than jumping above the list. A commodity tapped in the movers lists opens the same way: the list scrolls to its row, the panel opens under it, and focus moves to the row. At 560px the collar compacts (wordmark and data date share a line, the update time moves to the footer only, the six region tabs wrap into two rows), the movers lists stack, table cells pad 8px, the "Selisih dari nasional" column hides in the commodity table and its percentage moves under the commodity name ("−5,0% dari nasional"), map graticule ticks hide, and category chips scroll horizontally instead of wrapping. The page is comfortable at 360px with no horizontal page scroll.

## Elevation & Depth

Flat. Depth is conveyed by surface tone (Sheet Ground under Panel White), hairline borders, and ink rules. The only shadow is the chart readout floating over the profile.

### Shadow Vocabulary
- **Readout lift** (`box-shadow: 0 4px 12px -6px rgba(0,0,0,.3)`): the hover/keyboard readout on the price profile. Nowhere else.

### Named Rules
**The Paper Rule.** Panels sit on the sheet, they do not float. Use a 1px Rule border, not a shadow.

## Shapes

Square everywhere: zero radius on panels, chips, segmented controls, the select, the spike tag, and the readout. Lines do the structural work: a 2px Ink rule opens a block (lead price, table head), 1px Rule hairlines divide rows. The map sits in a 1px ink neat-line frame with degree ticks (110°10′ BT, 7°50′ LS) like a printed sheet. Region boundaries are 1px Map Edge lines, so even the pale Coast step reads against the panel.

## Components

### Region Tabs (Navigation)
Condensed caps on the collar. Transparent buttons in Collar Ink Muted, 3px transparent bottom border; hover lifts to Collar Ink; active (aria-pressed) gets Collar Ink plus a 3px Land Mid underline. Focus ring is Collar Gold inset −2px. On phones the six tabs wrap into two full-width rows (13px), so every region is visible without scrolling.

### Panels
Panel White, 1px Rule border, square. Header row: condensed caps title (`Peta harga · Cabai Merah Keriting`) left, a control or muted stamp right, 1px Rule beneath.

### Filter Chips (category tabs)
14px/500, 1px Rule border, transparent, 6px 12px. Hover darkens the border to Rule Strong. Active inverts to Ink fill with Panel text.

### Segmented Control (7/30/90 hari)
Joined buttons, 1px Rule Strong borders overlapping by 1px, Panel fill, 5px 12px. Active inverts to Ink.

### Select
Square, 1px Rule Strong border, Panel fill, CSS-drawn chevron from two gradients, 6px 30px 6px 10px.

### Spike Tag
"↑ LONJAKAN": Spike Red block, white condensed caps 12px/700, 0.08em, arrow icon leading. Placed after the lead price and inline in the commodity row (stacked under the name on phones).

### Data Tables
Column heads in Label style over a 2px Rule Strong rule; sortable heads are bare buttons that fill the whole header cell (a tap target at least 39px tall) with an 11px direction icon (a faint double arrow when inactive, a solid up or down arrow in Ink when active, mirrored in `aria-sort`). Both the region table and the commodity list sort; missing values always sort last. Rows 10px 16px with 1px Rule dividers; numbers right-aligned. Difference cells show signed rupiah in Ink with the signed percentage under it in Ink Muted. Rows are clickable: hover tints Row Hover, selected tints Row Selected and bolds the name. The national row closes the comparison table in bold with "acuan". Missing values read "tidak ada data" in italic Ink Muted.

### Panel Notes
A single 13px Ink line under a panel header, on a Rule hairline, for facts the panel depends on. The region table states the national spread in one sentence ("Semua wilayah DIY 16–33% lebih murah dari rata-rata nasional. Warna peta membandingkan antarwilayah DIY."), bridging its national column and the map's DIY baseline. The price profile states when it stands in for a picked regency ("Riwayat Sleman baru 2 hari, jadi grafik ini memakai rata-rata DIY. Harga Sleman hari ini: …"), and its title always names the region it shows. The hero adds the picked regency's own price and the date its 7-day numbers start; the collar note speaks only for the province. Notes and captions cap at 60ch (about 75 characters, since ch is the width of "0").

### Loading and Error States
While data loads, `main[aria-busy="true"]` shows still placeholder blocks in Rule (answer lines, map and chart areas, ruled table rows), never an animation. If the price files cannot load, the sheet shows one Panel-white notice with a solid Ink "Coba lagi" button and hides the region tabs. A failed trend history shows its own "Coba lagi" link in the chart caption; the rest of the page keeps working.

### Movers Lists
Two columns, "Kenaikan berikutnya" (Rise Red caps) and "Penurunan terbesar" (Fall Blue caps). Each item is an underlined commodity button with a Rule-coloured underline that darkens on hover, and an arrow-plus-percent value right-aligned. The commodity currently selected is bold with an Ink underline (`aria-current`).

### Hypsometric Map (signature)
Inline SVG of the five regencies filled from the ramp, 1px Map Edge boundaries, fill transitions 0.45s cubic-bezier(.16, 1, .3, 1). Hover brightens; selected regency gets a 3px Sel stroke; focus a 3px Focus stroke. Labels carry a halo stroke and counter-scale with a floor so they stay legible at 360px; small regencies get an offset label with a leader line, and that label is tappable too, since Kota Yogyakarta itself is about 22px across. Legend: seven-band ramp, signed percent ticks, caption "Lebih murah dari rata-rata DIY · Rata-rata DIY Rp … · Lebih mahal". The sea name is set in italic Ink Muted, not blue, so blue only ever means "cheaper".

### Price Profile (signature)
Inline SVG trend drawn as an elevation profile: 1.8px Ink line over an Ink area that fades from 16% to nothing toward the cut-off baseline (so it never reads as size from zero), Contour Brown hairlines at 50% opacity with price labels, dashed Ink Muted segments across data gaps, a dotted cursor with a hollow dot, and the floating readout. The day the 7-day change is measured from carries a hollow Contour Brown point labelled "acuan 7 hari", named again in the caption. The label takes the first spot beside the point that the line does not cross (near before far, above before below), sized from the rendered chart so it also clears on phones. A range of N days shows the end day and the N days before it, so the 7-day view matches the headline change. Hover, tap, and keyboard arrows step through days; on touch the readout stays until the next tap or a tap elsewhere, and a vertical swipe across the chart scrolls the page.

## Do's and Don'ts

### Do:
- **Do** colour regency price against the DIY average only with the seven-step hypsometric ramp, banded at ±3, ±10, ±20 percent.
- **Do** pair every rise or fall with an SVG arrow and Rise Red / Fall Blue.
- **Do** use condensed letterspaced caps (wdth 70–80, 0.07–0.1em) for map names, panel titles, column heads, and tabs.
- **Do** keep every corner square and separate with 1px Rule hairlines; open a block with a 2px Ink rule.
- **Do** define every new colour in both the light and dark token sets.
- **Do** show "tidak ada data" in italic Ink Muted wherever a price is null.

### Don't:
- **Don't** add rounded corners, card shadows, or gradient fills to panels; the readout is the only shadow.
- **Don't** reuse the ramp tints for categories, status, or decoration.
- **Don't** introduce a second typeface; vary Archivo's width and weight instead.
- **Don't** show direction by colour alone.
- **Don't** build equal KPI tiles; the answer headline leads, the map compares.
