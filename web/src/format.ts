// Indonesian display formats. Pure functions; no DOM.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const NUM = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

export const NO_DATA = "tidak ada data";

/** 45200 -> "45.200" */
export const num = (n: number): string => NUM.format(n);

/** 45200 -> "Rp 45.200" (non-breaking space) */
export const rp = (n: number | null): string => (n == null ? NO_DATA : `Rp ${NUM.format(n)}`);

/** 12.04 -> "+12,0%", -1.7 -> "−1,7%", 0 -> "±0,0%", null -> "–" */
export function pct(x: number | null): string {
  if (x == null) return "–";
  const s = Math.abs(x).toFixed(1).replace(".", ",");
  return (x > 0 ? "+" : x < 0 ? "−" : "±") + s + "%";
}

/** -17112 -> "−17.112", 278 -> "+278" */
export const signed = (n: number): string => (n > 0 ? "+" : n < 0 ? "−" : "") + NUM.format(Math.abs(n));

/** "2026-11-07" -> "7 Nov 2026" */
export function date(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[(m ?? 1) - 1]} ${y}`;
}

/** "2026-10-18" -> "18 Okt" (axis labels, where the year is already given at the ends) */
export function dateShort(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[(m ?? 1) - 1]}`;
}

/** "2026-11-08T06:00:03+07:00" -> "8 Nov 2026, 06.00 WIB" (timestamps are written in WIB) */
export function stamp(isoDateTime: string): string {
  const [day = "", time = ""] = isoDateTime.split("T");
  return `${date(day)}, ${time.slice(0, 5).replace(":", ".")} WIB`;
}

export type Direction = "up" | "down" | "flat" | "none";

export const direction = (x: number | null): Direction =>
  x == null ? "none" : x > 0 ? "up" : x < 0 ? "down" : "flat";

export const directionWord = (x: number | null): string =>
  x == null ? "belum ada perubahan 7 hari" : x > 0 ? "naik" : x < 0 ? "turun" : "tetap";

export const esc = (s: string): string =>
  s.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch] ?? ch);

/** Same base-day rule as scraper/build.py: 7 days back, else up to 3 earlier days. */
export function basePoint(series: readonly { date: string; price: number | null }[], day: string): { date: string; price: number } | null {
  const byDate = new Map(series.map((p) => [p.date, p.price]));
  const t = new Date(`${day}T00:00:00Z`);
  for (let back = 7; back <= 10; back++) {
    const d = new Date(t.getTime() - back * 86_400_000).toISOString().slice(0, 10);
    const p = byDate.get(d);
    if (p != null) return { date: d, price: p };
  }
  return null;
}
