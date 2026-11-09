import mapJson from "./diy-map.json";
import { esc, num, rp } from "./format";
import type { MapData } from "./types";

const MAP = mapJson as MapData;
const TOP = 14; // extra room above the land for the summit mark and tick labels

/** Stepped tints: regency price vs the DIY average, read as elevation vs sea level. */
export const BANDS = [
  { max: -20, token: "--h-sea3" },
  { max: -10, token: "--h-sea2" },
  { max: -3, token: "--h-sea1" },
  { max: 3, token: "--h-coast" },
  { max: 10, token: "--h-land1" },
  { max: 20, token: "--h-land2" },
  { max: Infinity, token: "--h-land3" },
] as const;
export const BAND_EDGES = ["−20%", "−10%", "−3%", "+3%", "+10%", "+20%"];

export const bandToken = (pct: number): string => (BANDS.find((b) => pct <= b.max) ?? BANDS[6]).token;
const PALE = new Set(["--h-sea1", "--h-coast", "--h-land1"]); // light enough in both themes to need dark lettering

function project(lon: number, lat: number): [number, number] {
  const p = MAP.projection;
  return [p.pad + (lon - p.lonMin) * p.kx * p.scale, TOP + p.pad + (p.latMax - lat) * p.scale];
}

export interface MapView {
  names: Record<string, string>;
  prices: Record<string, number | null>;
  base: number | null; // DIY average, same date
  selected: string;
  onSelect: (regionId: string) => void;
}

function describe(name: string, price: number | null, base: number | null): string {
  if (price == null) return `${name}: tidak ada data`;
  if (base == null) return `${name}: ${rp(price)}`;
  const pct = ((price - base) / base) * 100;
  const rel = Math.abs(pct) < 0.5 ? "sama dengan rata-rata DIY" : `${num(Math.abs(Math.round(pct)))}% lebih ${pct < 0 ? "murah" : "mahal"} dari rata-rata DIY`;
  return `${name}: ${rp(price)}, ${rel}`;
}

/** Keep SVG text readable when the drawing is scaled down: CSS reads --inv (viewBox px per screen px). */
export function counterScale(svg: SVGSVGElement): void {
  new ResizeObserver(() => {
    const vb = svg.viewBox.baseVal;
    if (vb && svg.clientWidth) svg.style.setProperty("--inv", String(Math.max(1, vb.width / svg.clientWidth)));
  }).observe(svg);
}

export function renderMap(svg: SVGSVGElement, view: MapView): void {
  const [, , w = 508, h = 418] = MAP.viewBox;
  const H = h + TOP;
  svg.setAttribute("viewBox", `0 0 ${w} ${H}`);
  let s = `<rect class="frame" x="4" y="4" width="${w - 8}" height="${H - 8}"/>`;

  // graticule ticks on the neatline, as on a printed map sheet
  for (const m of [10, 20, 30, 40, 50]) {
    const [x] = project(110 + m / 60, -7.6);
    if (x > w - 40) continue;
    s += `<line class="tick" x1="${x}" y1="4" x2="${x}" y2="10"/><text class="tick-lbl" x="${x + 3}" y="15">110°${m}′ BT</text>`;
  }
  for (const [deg, min] of [[7, 40], [7, 50], [8, 0], [8, 10]] as const) {
    const [, y] = project(110.1, -(deg + min / 60));
    if (y > H - 30) continue;
    s += `<line class="tick" x1="4" y1="${y}" x2="10" y2="${y}"/><text class="tick-lbl" transform="translate(15 ${y - 3}) rotate(-90)">${deg}°${String(min).padStart(2, "0")}′ LS</text>`;
  }

  const tint = (id: string): string => {
    const price = view.prices[id] ?? null;
    return price == null || view.base == null ? "--h-none" : bandToken(((price - view.base) / view.base) * 100);
  };
  for (const [id, region] of Object.entries(MAP.regions)) {
    const price = view.prices[id] ?? null;
    const fill = tint(id);
    const name = view.names[id] ?? id;
    s += `<path class="land${view.selected === id ? " sel" : ""}" data-r="${id}" d="${region.d}" transform="translate(0 ${TOP})" style="fill:var(${fill})" tabindex="0" role="button" aria-pressed="${view.selected === id}" aria-label="${esc(describe(name, price, view.base))}"/>`;
  }
  // keep the selected outline above its neighbours
  const sel = MAP.regions[view.selected];
  if (sel) s += `<path d="${sel.d}" transform="translate(0 ${TOP})" fill="none" stroke="var(--sel)" stroke-width="3" pointer-events="none"/>`;

  const [px, py] = project(110.4457, -7.5407); // Gunung Merapi summit
  s += `<path class="peak" d="M${px} ${py - 9}l6 9h-12z"/><text class="peak-lbl" x="${px + 9}" y="${py}">G. Merapi</text>`;
  const [sx, sy] = project(110.06, -8.13);
  s += `<text class="sea-lbl" x="${sx}" y="${sy}">SAMUDRA HINDIA</text>`;

  for (const [id, region] of Object.entries(MAP.regions)) {
    let [x = 0, y = 0] = region.label;
    y += TOP;
    const name = esc(view.names[id] ?? id);
    const price = view.prices[id] ?? null;
    const priceText = price == null ? "tidak ada data" : rp(price);
    let anchor = "middle";
    if (id === "kota-yogyakarta") {
      // too small to hold a label: lead it out to the empty sheet north of Gunungkidul
      const [lx, ly] = project(110.585, -7.705);
      s += `<line class="leader" x1="${x}" y1="${y}" x2="${lx - 4}" y2="${ly + 4}"/><circle class="anchor" cx="${x}" cy="${y}" r="2.6"/>`;
      x = lx;
      y = ly;
      anchor = "start";
    }
    const off = id === "kota-yogyakarta" ? " off" : PALE.has(tint(id)) ? " pale" : ""; // off: label sits on the open sheet, not on land
    const hit = off === " off" ? ` data-r="${id}"` : ""; // and stands in for a region too small to tap
    s += `<text class="lbl${off}"${hit} x="${x}" y="${y}" text-anchor="${anchor}">${name}</text><text class="lbl-price${off}"${hit} x="${x}" y="${y + 15}" text-anchor="${anchor}">${priceText}</text>`;
  }
  svg.innerHTML = s;

  svg.querySelectorAll<SVGTextElement>("text[data-r]").forEach((el) => el.addEventListener("click", () => view.onSelect(el.dataset.r ?? "diy")));
  svg.querySelectorAll<SVGPathElement>(".land").forEach((el) => {
    const go = () => view.onSelect(el.dataset.r ?? "diy");
    el.addEventListener("click", go);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        go();
      }
    });
  });
}
