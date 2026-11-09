import { date, dateShort, rp } from "./format";
import type { Point } from "./types";

const W = 480;
const H = 240;
const L = 16;
const RM = 60;
const T = 18;
const B = 32;

function niceStep(raw: number): number {
  const p = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((v) => v >= raw) ?? 10 * p;
}

type Spot = { x: number; y: number; anchor: "start" | "middle" | "end" };
/**
 * Where the "acuan 7 hari" label (w × h, user units) sits beside the point at (cx, cy):
 * the first spot whose box the line does not cross (near before far, above before below), or the one it crosses least.
 */
export function markSpot(cx: number, cy: number, w: number, h: number, lineY: (vx: number) => number | null): Spot {
  const spots = [-10, 10 + h, -10 - h, 10 + 2 * h].flatMap((dy) => [
    { x: cx, y: cy + dy, anchor: "middle" as const, x0: cx - w / 2 },
    { x: cx - 6, y: cy + dy, anchor: "end" as const, x0: cx - 6 - w },
    { x: cx + 6, y: cy + dy, anchor: "start" as const, x0: cx + 6 },
  ]);
  const hits = (sp: (typeof spots)[number]): number => {
    if (sp.x0 < L || sp.x0 + w > W - RM || sp.y - h < 0 || sp.y > H - B) return Infinity; // inside the plot, clear of the price labels
    let n = 0;
    for (let vx = sp.x0; vx <= sp.x0 + w; vx += 3) {
      const ly = lineY(vx);
      if (ly != null && ly > sp.y - h - 2 && ly < sp.y + 3) n++;
    }
    return n;
  };
  const best = spots.reduce((a, b) => (hits(b) < hits(a) ? b : a));
  return { x: best.x, y: best.y, anchor: best.anchor };
}

/**
 * Elevation-profile chart: area + line, contour lines labelled in rupiah,
 * gaps (null prices) drawn as breaks. Hover, tap, or arrow keys move a readout.
 * For assistive tech the chart is a slider over the days: aria-valuetext reads date and price.
 * `mark` is the date the 7-day change is measured from; it gets its own labelled point.
 * Returns the contour step so the caption can name it.
 */
export function renderProfile(svg: SVGSVGElement, readout: HTMLElement, points: Point[], unit: string, title: string, empty = "Belum cukup data untuk grafik.", mark?: string): number {
  const known = points.filter((p): p is { date: string; price: number } => p.price != null);
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  readout.hidden = true;
  if (known.length < 2) {
    for (const a of ["tabindex", "aria-valuemin", "aria-valuemax", "aria-valuenow", "aria-valuetext"]) svg.removeAttribute(a);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", empty);
    svg.innerHTML = `<text class="axis-lbl" x="${W / 2}" y="${H / 2}" text-anchor="middle">${empty}</text>`;
    svg.onpointermove = svg.onpointerleave = svg.onpointercancel = svg.onclick = svg.onblur = svg.onfocus = null;
    svg.onkeydown = null;
    return 0;
  }
  const vals = known.map((p) => p.price);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const step = niceStep((hi - lo) / 4 || hi * 0.02);
  const y0 = Math.floor(lo / step) * step - step;
  const y1 = Math.ceil(hi / step) * step;
  const x = (i: number) => L + (i / (points.length - 1)) * (W - L - RM);
  const y = (v: number) => T + (1 - (v - y0) / (y1 - y0)) * (H - T - B);

  // the terrain fill fades toward the cut-off baseline, so it does not read as size from zero
  let s = `<title>${title}</title><defs><linearGradient id="fade" gradientUnits="userSpaceOnUse" x1="0" y1="${T}" x2="0" y2="${H - B}"><stop offset="0" class="fade-top"/><stop offset="1" class="fade-end"/></linearGradient></defs>`;
  for (let v = y0; v <= y1 + 1; v += step) {
    s += `<line class="contour" x1="${L}" x2="${W - RM + 6}" y1="${y(v)}" y2="${y(v)}"/><text class="contour-lbl" x="${W - RM + 10}" y="${y(v) + 3.5}">${rp(v).replace("Rp ", "")}</text>`;
  }
  // consecutive known points form one segment; a null breaks the line
  const segments: number[][] = [];
  let cur: number[] = [];
  points.forEach((p, i) => {
    if (p.price == null) {
      if (cur.length) segments.push(cur);
      cur = [];
    } else cur.push(i);
  });
  if (cur.length) segments.push(cur);
  // a dashed bridge over each run of missing days: the line continues, the gap stays visible
  segments.slice(1).forEach((seg, k) => {
    const a = segments[k]?.[segments[k].length - 1] ?? 0;
    const b = seg[0] ?? 0;
    s += `<line class="gap" x1="${x(a)}" y1="${y(points[a]?.price ?? 0)}" x2="${x(b)}" y2="${y(points[b]?.price ?? 0)}"/>`;
  });
  for (const seg of segments) {
    const line = seg.map((i) => `${x(i).toFixed(1)},${y(points[i]?.price ?? 0).toFixed(1)}`).join(" ");
    const first = seg[0] ?? 0;
    const last = seg[seg.length - 1] ?? 0;
    s += `<polygon class="area" points="${x(first)},${H - B} ${line} ${x(last)},${H - B}"/><polyline class="line" points="${line}"/>`;
  }
  const lastIdx = points.length - 1;
  const lastPoint = points[lastIdx];
  if (lastPoint?.price != null) s += `<circle class="end" cx="${x(lastIdx)}" cy="${y(lastPoint.price)}" r="4.5"/>`;
  const m = mark ? points.findIndex((p) => p.date === mark) : -1;
  const mp = points[m];
  if (mp?.price != null) {
    // label text is counter-scaled on small screens (see map.ts counterScale): size its box from the rendered width
    const fs = Math.max(11.5, 10.5 * Math.max(1, W / (svg.clientWidth || W)));
    const lineY = (vx: number): number | null => {
      const f = Math.max(0, Math.min(lastIdx, ((vx - L) / (W - L - RM)) * lastIdx));
      const i = Math.floor(f);
      const a = points[i]?.price;
      const b = points[i + 1]?.price ?? a;
      return a == null || b == null ? null : y(a + (b - a) * (f - i));
    };
    const at = markSpot(x(m), y(mp.price), 6.6 * fs, fs, lineY); // "acuan 7 hari" is about 6.6em wide
    s += `<circle class="mark" cx="${x(m)}" cy="${y(mp.price)}" r="4"/><text class="mark-lbl" x="${at.x}" y="${at.y}" text-anchor="${at.anchor}">acuan 7 hari</text>`;
  }
  s += `<text class="axis-lbl" x="${L}" y="${H - 10}">${date(points[0]?.date ?? "")}</text><text class="axis-lbl" x="${W - RM}" y="${H - 10}" text-anchor="end">${date(lastPoint?.date ?? "")}</text>`;
  // two intermediate dates so the reader can place a dip without hovering
  if (points.length >= 7) {
    for (const f of [1 / 3, 2 / 3]) {
      const i = Math.round(lastIdx * f);
      s += `<line class="contour" x1="${x(i)}" x2="${x(i)}" y1="${H - B}" y2="${H - B + 4}"/><text class="axis-lbl" x="${x(i)}" y="${H - 10}" text-anchor="middle">${dateShort(points[i]?.date ?? "")}</text>`;
    }
  }
  s += `<g class="hover" visibility="hidden"><line class="cursor" y1="${T}" y2="${H - B}"/><circle class="cursor-dot" r="4.5"/></g>`;
  svg.innerHTML = s;

  const hover = svg.querySelector<SVGGElement>(".hover");
  const cursor = svg.querySelector<SVGLineElement>(".cursor");
  const dot = svg.querySelector<SVGCircleElement>(".cursor-dot");
  let active = lastIdx;
  const text = (p: Point) => `${date(p.date)}: ${p.price == null ? "tidak ada data" : `${rp(p.price)}/${unit}`}${p.date === mark ? ", acuan 7 hari" : ""}`;
  const sync = () => {
    const p = points[active];
    svg.setAttribute("aria-valuenow", String(active));
    if (p) svg.setAttribute("aria-valuetext", text(p));
  };
  svg.setAttribute("role", "slider");
  svg.setAttribute("tabindex", "0");
  svg.setAttribute("aria-valuemin", "0");
  svg.setAttribute("aria-valuemax", String(lastIdx));
  sync();
  const show = (i: number) => {
    active = Math.max(0, Math.min(lastIdx, i));
    sync();
    const p = points[active];
    if (!p || !hover || !cursor || !dot) return;
    hover.setAttribute("visibility", "visible");
    cursor.setAttribute("x1", String(x(active)));
    cursor.setAttribute("x2", String(x(active)));
    dot.setAttribute("cx", String(x(active)));
    dot.setAttribute("cy", String(p.price == null ? -20 : y(p.price)));
    readout.innerHTML = `${date(p.date)}<b>${p.price == null ? "tidak ada data" : `${rp(p.price)}/${unit}`}</b>`;
    readout.hidden = false;
    const left = (x(active) / W) * 100;
    readout.style.left = left > 60 ? "" : `calc(${left}% + 12px)`;
    readout.style.right = left > 60 ? `calc(${100 - left}% + 12px)` : "";
  };
  const hide = () => {
    hover?.setAttribute("visibility", "hidden");
    readout.hidden = true;
  };
  const at = (e: MouseEvent) => {
    const box = svg.getBoundingClientRect();
    const vx = ((e.clientX - box.left) / box.width) * W;
    show(Math.round(((vx - L) / (W - L - RM)) * lastIdx));
  };
  svg.onpointermove = at;
  // touch has no hover: a tap shows the day and it stays until the next tap, or a tap outside (blur)
  svg.onclick = at;
  svg.onpointerleave = (e) => {
    if (e.pointerType === "mouse") hide();
  };
  svg.onpointercancel = hide; // the swipe turned into a page scroll
  svg.onblur = hide;
  svg.onfocus = () => show(active);
  svg.onkeydown = (e) => {
    const to: Record<string, number> = { ArrowLeft: active - 1, ArrowDown: active - 1, ArrowRight: active + 1, ArrowUp: active + 1, Home: 0, End: lastIdx, PageUp: active + 7, PageDown: active - 7 };
    const next = to[e.key];
    if (next !== undefined) {
      e.preventDefault();
      show(next);
    }
  };
  return step;
}
